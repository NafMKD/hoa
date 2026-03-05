/**
 * Telegram Web App helpers — stubbed for now.
 * When ready to integrate the Telegram SDK, replace these stubs
 * with real window.Telegram.WebApp calls.
 */

export function getInitData(): string {
  return "";
}

export function getTelegramUser(): null {
  return null;
}

export function requestContact(): Promise<string | null> {
  return Promise.resolve(null);
}

export function isTelegramEnv(): boolean {
  return false;
}
