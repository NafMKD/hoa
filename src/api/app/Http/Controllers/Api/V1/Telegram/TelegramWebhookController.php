<?php

namespace App\Http\Controllers\Api\V1\Telegram;

use App\Http\Controllers\Controller;
use App\Services\TelegramAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Telegram bot webhook. Set this URL as your bot's webhook so we receive updates
 * when the user shares their contact (or sends phone as text) from the Mini App.
 * We then link telegram_user_id to the user so the next auth with init_data only succeeds.
 */
class TelegramWebhookController extends Controller
{
    public function __construct(
        protected TelegramAuthService $telegramAuth
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();
        $message = $payload['message'] ?? null;
        if (!$message) {
            return response()->json(['ok' => true]);
        }

        $from = $message['from'] ?? null;
        $telegramUserId = isset($from['id']) ? (int) $from['id'] : null;
        if ($telegramUserId === null) {
            return response()->json(['ok' => true]);
        }

        $phone = null;

        // Contact shared from Mini App (requestContact)
        if (isset($message['contact']['phone_number'])) {
            $phone = $message['contact']['phone_number'];
        }

        // Phone sent as text in the bot chat (e.g. user pastes or types it)
        if ($phone === null && !empty($message['text'])) {
            $text = trim($message['text']);
            if (preg_match('/[\d\+][\d\s\-]{8,}/', $text)) {
                $phone = $text;
            }
        }

        if ($phone === null || $phone === '') {
            return response()->json(['ok' => true]);
        }

        $user = $this->telegramAuth->linkTelegramUserByPhone($phone, $telegramUserId);
        if ($user) {
            Log::info('Telegram webhook: linked telegram_user_id to user', [
                'user_id' => $user->id,
                'telegram_user_id' => $telegramUserId,
            ]);
        } else {
            Log::warning('Telegram webhook: no user found for phone', [
                'telegram_user_id' => $telegramUserId,
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
