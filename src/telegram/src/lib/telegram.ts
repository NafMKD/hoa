/**
 * Telegram Web App SDK integration.
 * Requires telegram-web-app.js loaded before this (e.g. in index.html).
 * @see https://core.telegram.org/bots/webapps
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe?: { user?: { id: number } };
        requestContact: (callback?: (shared: boolean) => void) => void;
        onEvent: (eventType: string, callback: (payload: { status?: string }) => void) => void;
        offEvent: (eventType: string, callback: (payload: { status?: string }) => void) => void;
        ready: () => void;
        expand: () => void;
        close: () => void;
        openLink: (url: string) => void;
        MainButton?: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
      };
    };
  }
}

const WebApp = () => window.Telegram?.WebApp;

/**
 * True if the app is running inside Telegram (initData is present).
 * When false, the app must not be used; show "Open in Telegram" instead.
 */
export function isTelegramEnv(): boolean {
  const wa = WebApp();
  return Boolean(wa?.initData);
}

/**
 * Raw init data string to send to backend for validation.
 * Empty if not in Telegram.
 */
export function getInitData(): string {
  return WebApp()?.initData ?? "";
}

/**
 * Parsed user from initDataUnsafe (do not trust for auth; backend validates initData).
 */
export function getTelegramUser(): { id: number } | null {
  const user = WebApp()?.initDataUnsafe?.user;
  return user && typeof user.id === "number" ? { id: user.id } : null;
}

/**
 * Ask Telegram to show the "Share phone" dialog.
 * When user shares, the bot receives the contact via webhook; then call auth again with init_data only.
 * Resolves with true if user shared, false if cancelled.
 */
export function requestContact(): Promise<boolean> {
  return new Promise((resolve) => {
    const wa = WebApp();
    if (!wa?.requestContact) {
      resolve(false);
      return;
    }
    const handler = (e: { status?: string }) => {
      wa.offEvent?.("contactRequested", handler);
      resolve(e.status === "sent");
    };
    wa.onEvent?.("contactRequested", handler);
    wa.requestContact((shared) => {
      wa.offEvent?.("contactRequested", handler);
      resolve(Boolean(shared));
    });
  });
}

/**
 * Call when the Mini App is ready (hides Telegram loading placeholder).
 */
export function ready(): void {
  WebApp()?.ready?.();
}

/**
 * Expand Mini App to full height.
 */
export function expand(): void {
  WebApp()?.expand?.();
}

/**
 * Open a link in external browser (e.g. "Open in Telegram" t.me link).
 */
export function openLink(url: string): void {
  WebApp()?.openLink?.(url) ?? window.open(url, "_blank");
}

/**
 * Show Telegram main button (e.g. "Share phone number").
 */
export function setMainButton(text: string, onClick: () => void): () => void {
  const wa = WebApp();
  const btn = wa?.MainButton;
  if (!btn) return () => {};
  btn.setText(text);
  btn.onClick(onClick);
  btn.show();
  return () => {
    btn.offClick(onClick);
    btn.hide();
  };
}

export function showMainButtonProgress(show: boolean): void {
  const btn = WebApp()?.MainButton;
  if (!btn) return;
  if (show) btn.showProgress?.();
  else btn.hideProgress?.();
}

export function hideMainButton(): void {
  WebApp()?.MainButton?.hide?.();
}

export function showMainButton(): void {
  WebApp()?.MainButton?.show?.();
}
