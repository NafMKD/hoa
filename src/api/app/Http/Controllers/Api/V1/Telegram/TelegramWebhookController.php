<?php

namespace App\Http\Controllers\Api\V1\Telegram;

use App\Http\Controllers\Controller;
use App\Services\TelegramAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Receives Telegram Bot API updates (e.g. when user shares contact via Mini App requestContact()).
 * Set this URL as your bot's webhook so we can link telegram_user_id to users when they share phone.
 */
class TelegramWebhookController extends Controller
{
    public function __construct(
        protected TelegramAuthService $telegramAuth
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (isset($payload['message']['contact'])) {
            $message = $payload['message'];
            $from = $message['from'] ?? null;
            $contact = $message['contact'];

            $telegramUserId = isset($from['id']) ? (int) $from['id'] : null;
            $phone = $this->normalizePhone($contact['phone_number'] ?? '');

            if ($telegramUserId !== null && $phone !== '') {
                $user = $this->telegramAuth->linkTelegramUserByPhone($phone, $telegramUserId);
                if ($user) {
                    Log::info('Telegram webhook: linked telegram_user_id to user', [
                        'telegram_user_id' => $telegramUserId,
                        'user_id'          => $user->id,
                    ]);
                } else {
                    Log::warning('Telegram webhook: no user found for phone', [
                        'telegram_user_id' => $telegramUserId,
                        'phone_raw'        => $contact['phone_number'] ?? '',
                        'phone_normalized' => $phone,
                    ]);
                }
            }
        }

        return response()->json(['ok' => true]);
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone);
        if ($digits === '' || strlen($digits) < 9) {
            return '';
        }
        if (strlen($digits) === 12 && str_starts_with($digits, '251')) {
            return '0' . substr($digits, 3, 9);
        }
        if (strlen($digits) === 10 && str_starts_with($digits, '0')) {
            return $digits;
        }
        if (strlen($digits) === 9) {
            return '0' . $digits;
        }
        if (strlen($digits) >= 10 && str_starts_with($digits, '251')) {
            return '0' . substr($digits, 3, 9);
        }
        return $digits;
    }
}
