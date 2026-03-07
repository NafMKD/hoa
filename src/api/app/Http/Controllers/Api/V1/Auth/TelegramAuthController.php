<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Services\TelegramAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class TelegramAuthController extends Controller
{
    protected TelegramAuthService $telegramAuth;

    public function __construct(TelegramAuthService $telegramAuth)
    {
        $this->telegramAuth = $telegramAuth;
    }

    /**
     * Authenticate via Telegram Mini App.
     * - init_data (required): validated on server; contains telegram user id.
     * - phone (optional): when provided, find user by phone (normalized: "+251 98 437 1917" matches "0984371917")
     *   and link telegram_user_id; then return token. Omit phone to sign in by telegram_user_id only.
     * If phone is omitted and no user is found for the telegram user id, returns 401 with need_phone.
     */
    public function authenticate(Request $request): JsonResponse
    {
        $this->ensureIsNotRateLimited($request);

        $validated = $request->validate([
            'init_data' => ['required', 'string'],
            'phone'     => ['nullable', 'string', 'max:30'],
        ]);

        $parsed = $this->telegramAuth->validateInitData($validated['init_data']);
        if (!$parsed) {
            RateLimiter::hit($this->throttleKey($request));
            return response()->json([
                'status'  => self::_ERROR,
                'message' => 'Invalid or expired Telegram init data.',
                'code'    => 'invalid_init_data',
            ], 401);
        }

        $telegramUserId = isset($parsed['user']['id']) ? (int) $parsed['user']['id'] : null;
        if ($telegramUserId === null) {
            return response()->json([
                'status'  => self::_ERROR,
                'message' => 'Invalid init data: missing user.',
                'code'    => 'invalid_init_data',
            ], 401);
        }

        $user = null;

        if (!empty($validated['phone'])) {
            $user = $this->telegramAuth->findUserByPhone($validated['phone'], $telegramUserId);
            if (!$user) {
                RateLimiter::hit($this->throttleKey($request));
                return response()->json([
                    'status'  => self::_ERROR,
                    'message' => 'No account found with this phone number. Please contact the administrator.',
                    'code'    => 'user_not_found',
                ], 404);
            }
        } else {
            $user = $this->telegramAuth->findUserByTelegramId($telegramUserId);
            if (!$user) {
                return response()->json([
                    'status'  => self::_ERROR,
                    'message' => 'Share your phone number to link your account.',
                    'code'    => 'need_phone',
                ], 401);
            }
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

    protected function throttleKey(Request $request): string
    {
        return 'telegram-auth|' . $request->ip();
    }
}
