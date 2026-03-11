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
     * @param string $telegramUserId
     * @return User|null
     */
    public function findUserByTelegramId(string $telegramUserId): ?User
    {
        return User::where('telegram_user_id', (string) $telegramUserId)->first();
    }

    /**
     * Find user by phone (from Mini App) and optionally link Telegram user id.
     * Normalizes so Telegram format "+251 98 437 1917" matches system "0984371917".
     *
     * @param string $phone Phone from Telegram (e.g. "+251 98 437 1917") or "0984371917"
     * @param string|null $telegramUserId Telegram user id from init data (stored as string)
     * @return User|null
     */
    public function findUserByPhone(string $phone, ?string $telegramUserId = null): ?User
    {
        // 1. Remove everything except digits
        $digits = preg_replace('/\D/', '', $phone);

        if (strlen($digits) < 9) {
            return null;
        }

        $canonical = null;

        // 2. Normalize to 09... format
        if (str_starts_with($digits, '251') && strlen($digits) === 12) {
            $canonical = '0' . substr($digits, 3);
        } elseif (str_starts_with($digits, '0') && strlen($digits) === 10) {
            $canonical = $digits;
        } elseif (strlen($digits) === 9) {
            $canonical = '0' . $digits;
        } else {
            // Fallback: take the last 9 digits and prefix with 0
            $canonical = '0' . substr($digits, -9);
        }

        // 3. Define all possible ways this phone might be stored
        $variants = array_unique([
            $canonical,                      // 0984371917
            '+251' . substr($canonical, 1),  // +251984371917
            substr($canonical, 1),           // 984371917
        ]);

        // 4. Search the database
        $user = User::whereIn('phone', $variants)->first();

        if ($user) {
            if ($telegramUserId !== null && (string) $user->telegram_user_id !== (string) $telegramUserId) {
                $user->update(['telegram_user_id' => (string) $telegramUserId]);
            }
            return $user->fresh();
        }

        return null;
    }

    /**
     * Link telegram_user_id to an existing user by phone. Used by the bot webhook when the user
     * shares their contact (or sends phone as text) from the Mini App. Normalizes phone so
     * "+251 98 437 1917" matches system "0984371917".
     *
     * @param string $phone Raw phone from Telegram (e.g. "+251 98 437 1917" or "0984371917")
     * @param string $telegramUserId Telegram user id (from update.message.from.id), stored as string
     * @return User|null
     */
    public function linkTelegramUserByPhone(string $phone, string $telegramUserId): ?User
    {
        return $this->findUserByPhone($phone, $telegramUserId);
    }
}