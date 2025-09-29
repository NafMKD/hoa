<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Handle user login with phone and password.
     *
     * @param  Request  $request
     * @return JsonResponse
     *
     * @throws ValidationException
     */
    public function login(Request $request): JsonResponse
    {
        $this->ensureIsNotRateLimited($request);

        $credentials = $request->validate([
            'phone'    => ['required', 'string', 'regex:/^\+?[0-9]{10,15}$/'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        if (! Auth::attempt($credentials)) {
            RateLimiter::hit($this->throttleKey($request));
            throw ValidationException::withMessages([
                'phone' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey($request));

        $user = $request->user();

        // Update last login time
        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        // Revoke old tokens for security (forces single-session if desired)
        $user->tokens()->delete();

        $token = $user->createToken('api-token')->plainTextToken;

        // Check if password is still the default one
        $isDefaultPassword = Hash::check('12345678', $user->password);

        return response()->json([
            'status'  => self::_SUCCESS,
            'token'   => $token,
            'user'    => $user,
            'change_pass' => $isDefaultPassword,
        ]);
    }

    /**
     * Handle user logout and revoke Sanctum token.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => self::_SUCCESS,
        ]);
    }

    /**
     * Ensure login attempts are not rate limited.
     *
     * @param  Request  $request
     * @return void
     *
     * @throws ValidationException
     */
    protected function ensureIsNotRateLimited(Request $request): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request), 5)) {
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
     * Get the throttle key for login attempts.
     *
     * @param  Request  $request
     * @return string
     */
    protected function throttleKey(Request $request): string
    {
        return Str::lower($request->input('phone')).'|'.$request->ip();
    }
}
