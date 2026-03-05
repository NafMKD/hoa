<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TelegramAuthService
{
    /**
     * Validate Telegram WebApp init data and extract user info.
     *
     * @param string $initData Raw init data query string from Telegram
     * @return array{user: array, auth_date: int}|null Parsed data or null if invalid
     */
    public function validateInitData(string $initData): ?array
    {
        if (app()->environment('local') && $initData === 'dev_bypass') {
            return [
                'user'      => ['id' => 0],
                'auth_date' => time(),
            ];
        }

        $token = config('services.telegram.bot_token');
        if (empty($token)) {
            return null;
        }

        parse_str($initData, $params);
        $hash = $params['hash'] ?? null;
        unset($params['hash']);

        if (empty($hash) || empty($params)) {
            return null;
        }

        ksort($params);
        $dataCheckString = collect($params)
            ->map(fn ($value, $key) => "{$key}={$value}")
            ->implode("\n");

        $secretKey = hash_hmac('sha256', $token, 'WebAppData', true);
        $computedHash = hash_hmac('sha256', $dataCheckString, $secretKey);

        if (!hash_equals($computedHash, $hash)) {
            return null;
        }

        $authDate = (int) ($params['auth_date'] ?? 0);
        if ($authDate < (time() - 86400)) {
            return null;
        }

        return [
            'user'      => isset($params['user']) ? json_decode($params['user'], true) : null,
            'auth_date' => $authDate,
        ];
    }

    /**
     * Find or create user by phone and optionally link Telegram user id.
     *
     * @param string $phone User phone (must exist in system)
     * @param int|null $telegramUserId Telegram user id from init data
     * @return User|null
     */
    public function findUserByPhone(string $phone, ?int $telegramUserId = null): ?User
    {
        $phone = preg_replace('/\s+/', '', $phone);
        if (empty($phone)) {
            return null;
        }

        $user = User::where('phone', $phone)->first();
        if (!$user) {
            return null;
        }

        if ($telegramUserId !== null && (int) $user->telegram_user_id !== (int) $telegramUserId) {
            $user->update(['telegram_user_id' => $telegramUserId]);
        }

        return $user;
    }
}
