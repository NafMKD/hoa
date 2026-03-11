import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { isTelegramEnv, openLink } from "@/lib/telegram.ts";

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "noah_garden_bot";

/**
 * When the app is not opened inside Telegram (and not in dev mode), show a full-screen message
 * and block access. The app must only run inside the Telegram Mini App.
 */
export function TelegramGate({ children, allowDevMode = true }: { children: ReactNode; allowDevMode?: boolean }) {
  const { t } = useTranslation();

  const isDev = allowDevMode && isDevMode();
  if (isTelegramEnv() || isDev) {
    return <>{children}</>;
  }

  const botUrl = `https://t.me/${BOT_USERNAME}`;

  return (
    <div className="telegram-gate">
      <div className="telegram-gate-content">
        <h1>{t("common.appName")}</h1>
        <p>{t("auth.openInTelegramSubtitle")}</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => openLink(botUrl)}
        >
          {t("auth.openInTelegram")}
        </button>
      </div>
      <style>{`
        .telegram-gate {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--color-bg);
        }
        .telegram-gate-content {
          text-align: center;
          max-width: 320px;
        }
        .telegram-gate-content h1 {
          font-family: "Baloo 2", sans-serif;
          font-size: 28px;
          color: var(--color-primary);
          margin-bottom: 16px;
        }
        .telegram-gate-content p {
          color: var(--color-text-secondary);
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}

/**
 * Dev mode: allow running outside Telegram (e.g. ?dev=1 for testing with phone form).
 */
export function isDevMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("dev") === "1";
}
