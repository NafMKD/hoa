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

        $botId = config('services.telegram.bot_id');
        if (!empty($botId) && is_string($token)) {
            $tokenBotId = explode(':', $token, 2)[0] ?? null;
            if ($tokenBotId !== null && (string) $botId !== (string) $tokenBotId) {
                return null;
            }
        }

        return [
            'user'      => isset($params['user']) ? json_decode($params['user'], true) : null,
            'auth_date' => $authDate,
        ];
    }

    /**
     * Find user by Telegram user id (from validated init data).
     *
     * @param int $telegramUserId
     * @return User|null
     */
    public function findUserByTelegramId(int $telegramUserId): ?User
    {
        return User::where('telegram_user_id', $telegramUserId)->first();
    }

    /**
     * Find user by phone (from Mini App) and optionally link Telegram user id.
     * Normalizes so Telegram format "+251 98 437 1917" matches system "0984371917".
     *
     * @param string $phone Phone from Telegram (e.g. "+251 98 437 1917") or "0984371917"
     * @param int|null $telegramUserId Telegram user id from init data
     * @return User|null
     */
    public function findUserByPhone(string $phone, ?int $telegramUserId = null): ?User
    {
        $digits = preg_replace('/\D/', '', $phone);
        if (strlen($digits) < 9) {
            return null;
        }
        $canonical = null;
        if (strlen($digits) === 12 && str_starts_with($digits, '251')) {
            $canonical = '0' . substr($digits, 3, 9);
        } elseif (strlen($digits) === 10 && $digits[0] === '0') {
            $canonical = $digits;
        } elseif (strlen($digits) === 9) {
            $canonical = '0' . $digits;
        } else {
            $canonical = '0' . substr($digits, -9);
        }
        $variants = [$canonical];
        if (strlen($canonical) === 10 && $canonical[0] === '0') {
            $variants[] = '+251' . substr($canonical, 1);
        }
        foreach ($variants as $p) {
            $user = User::where('phone', $p)->first();
            if ($user) {
                if ($telegramUserId !== null && (int) $user->telegram_user_id !== (int) $telegramUserId) {
                    $user->update(['telegram_user_id' => $telegramUserId]);
                }
                return $user->fresh();
            }
        }
        return null;
    }
}