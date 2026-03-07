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
                }
            }
        }

        return response()->json(['ok' => true]);
    }

    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\s+/', '', $phone);
        $phone = ltrim($phone, '+');
        if (preg_match('/^251(\d{9})$/', $phone, $m)) {
            return '0' . $m[1];
        }
        if (!preg_match('/^0/', $phone) && strlen($phone) >= 9) {
            return '0' . $phone;
        }
        return $phone;
    }
}
