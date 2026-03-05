<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Services\TelegramAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TelegramAuthController extends Controller
{
    protected TelegramAuthService $telegramAuth;

    /**
     * TelegramAuthController constructor.
     *
     * @param TelegramAuthService $telegramAuth
     */
    public function __construct(TelegramAuthService $telegramAuth)
    {
        $this->telegramAuth = $telegramAuth;
    }

    /**
     * Authenticate user via Telegram init data and phone.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function authenticate(Request $request): JsonResponse
    {
        $this->ensureIsNotRateLimited($request);

        $validated = $request->validate([
            'init_data' => ['required', 'string'],
            'phone'     => ['required', 'string', 'regex:/^\+?[0-9]{10,15}$/'],
        ]);

        $parsed = $this->telegramAuth->validateInitData($validated['init_data']);
        if (!$parsed) {
            RateLimiter::hit($this->throttleKey($request));
            return response()->json([
                'status'  => self::_ERROR,
                'message' => 'Invalid or expired Telegram init data.',
            ], 401);
        }

        $telegramUserId = $parsed['user']['id'] ?? null;
        $user = $this->telegramAuth->findUserByPhone($validated['phone'], $telegramUserId);

        if (!$user) {
            RateLimiter::hit($this->throttleKey($request));
            return response()->json([
                'status'  => self::_ERROR,
                'message' => 'No account found with this phone number. Please contact the administrator.',
            ], 404);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'status'  => self::_ERROR,
                'message' => 'Your account is not active. Please contact the administrator.',
            ], 403);
        }

        RateLimiter::clear($this->throttleKey($request));

        $user->forceFill(['last_login_at' => now()])->save();
        $user->tokens()->delete();

        $token = $user->createToken('telegram-app')->plainTextToken;
        $isDefaultPassword = Hash::check(self::_DEFAULT_PASSWORD, $user->password);

        return response()->json([
            'status'       => self::_SUCCESS,
            'token'       => $token,
            'user'        => $user,
            'change_pass'  => $isDefaultPassword,
        ]);
    }

    /**
     * Ensure requests are not rate limited.
     *
     * @param Request $request
     * @return void
     * @throws ValidationException
     */
    protected function ensureIsNotRateLimited(Request $request): void
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey($request), 10)) {
            return;
        }

        throw ValidationException::withMessages([
            'phone' => __('auth.throttle', [
                'seconds' => RateLimiter::availableIn($this->throttleKey($request)),
                'minutes' => ceil(RateLimiter::availableIn($this->throttleKey($request)) / 60),
            ]),
        ]);
    }

    /**
     * Get the throttle key.
     *
     * @param Request $request
     * @return string
     */
    protected function throttleKey(Request $request): string
    {
        return 'telegram-auth|' . $request->ip();
    }
}
