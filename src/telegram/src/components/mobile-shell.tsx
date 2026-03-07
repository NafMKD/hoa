import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getLocale, setLocale } from "@/i18n/config.ts";

export function MobileShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const current = getLocale();

  return (
    <div
      className="mobile-shell"
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        padding: "0 20px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="lang-switcher" role="group" aria-label={t("common.language")}>
        <button
          type="button"
          className={`lang-btn ${current === "en" ? "active" : ""}`}
          onClick={() => setLocale("en")}
          aria-pressed={current === "en"}
          lang="en"
        >
          English
        </button>
        <button
          type="button"
          className={`lang-btn ${current === "am" ? "active" : ""}`}
          onClick={() => setLocale("am")}
          aria-pressed={current === "am"}
          lang="am"
        >
          አማርኛ
        </button>
      </div>
      {children}
      <style>{`
        .mobile-shell {
          background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface-soft) 100%);
        }
        .lang-switcher {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
          padding: 12px 0 8px;
        }
        .lang-btn {
          min-height: 36px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 2px solid var(--color-border);
          background: var(--color-surface);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-secondary);
          transition: background-color var(--transition), border-color var(--transition), color var(--transition);
          cursor: pointer;
        }
        .lang-btn:hover {
          border-color: var(--color-secondary);
          color: var(--color-text);
        }
        .lang-btn.active {
          background: var(--color-primary-light);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
