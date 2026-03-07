import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { TOKEN_KEY } from "@/lib/api.ts";
import {
  getInitData,
  requestContact,
  ready,
  expand,
  setMainButton,
  showMainButtonProgress,
} from "@/lib/telegram.ts";
import { isDevMode } from "@/components/telegram-gate.tsx";

const AUTH_RETRY_DELAY_MS = 1800;
const AUTH_RETRY_MAX = 3;

export function AuthScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needPhone, setNeedPhone] = useState(false);

  const tryAuthWithInitData = async (): Promise<"ok" | "need_phone" | "invalid" | "other"> => {
    const initData = getInitData();
    if (!initData && !isDevMode()) return "invalid";
    try {
      const { data, status } = await api.post("/auth/telegram", {
        init_data: initData || "dev_bypass",
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      if (status === 200 && data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        navigate("/invoices", { replace: true });
        return "ok";
      }
      return "other";
    } catch (err: unknown) {
      const res = (err as { response?: { status?: number; data?: { code?: string } } })?.response;
      if (res?.status === 401 && res?.data?.code === "need_phone") return "need_phone";
      if (res?.status === 401) return "invalid";
      if (res?.status === 404) {
        setError(t("auth.errorNotFound"));
        return "other";
      }
      setError((res?.data as { message?: string })?.message ?? t("auth.errorGeneric"));
      return "other";
    }
  };

  useEffect(() => {
    ready();
    expand();
  }, []);

  useEffect(() => {
    if (isDevMode()) {
      setNeedPhone(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const initData = getInitData();
      if (!initData) return;
      setLoading(true);
      setError("");
      const result = await tryAuthWithInitData();
      if (cancelled) return;
      setLoading(false);
      if (result === "need_phone") setNeedPhone(true);
      if (result === "invalid") setError(t("auth.errorInvalid"));
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSharePhone = async () => {
    setError("");
    setLoading(true);
    showMainButtonProgress(true);
    const shared = await requestContact();
    showMainButtonProgress(false);
    if (!shared) {
      setLoading(false);
      return;
    }
    for (let i = 0; i < AUTH_RETRY_MAX; i++) {
      await new Promise((r) => setTimeout(r, AUTH_RETRY_DELAY_MS));
      const result = await tryAuthWithInitData();
      if (result === "ok") return;
      if (result !== "need_phone") {
        setLoading(false);
        if (result === "invalid") setError(t("auth.errorInvalid"));
        return;
      }
    }
    setError(t("auth.errorGeneric"));
    setLoading(false);
  };

  useEffect(() => {
    if (!needPhone || isDevMode()) return;
    const cleanup = setMainButton(t("auth.sharePhoneButton"), handleSharePhone);
    return cleanup;
  }, [needPhone]);

  const handleConnect = async () => {
    setError("");
    const phoneToUse = phone.trim();
    if (!phoneToUse) {
      setError(t("auth.errorRequired"));
      return;
    }
    setLoading(true);
    const result = await tryAuthWithInitData();
    setLoading(false);
    if (result === "invalid") setError(t("auth.errorInvalid"));
    else if (result === "other" && !error) setError(t("auth.errorGeneric"));
  };

  if (isDevMode()) {
    return (
      <div className="auth-screen">
        <div className="auth-header">
          <h1>{t("auth.title")}</h1>
          <p>{t("auth.subtitle")}</p>
        </div>
        <div className="auth-form">
          <label htmlFor="phone">{t("auth.phoneLabel")}</label>
          <input
            id="phone"
            type="tel"
            placeholder={t("auth.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            aria-label={t("auth.phoneLabel")}
          />
          <button onClick={handleConnect} disabled={loading} className="btn-primary" type="button">
            {loading ? t("auth.connecting") : t("auth.signIn")}
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>
        <style>{authStyles}</style>
      </div>
    );
  }

  if (loading && !needPhone) {
    return (
      <div className="auth-screen auth-screen--center">
        <p className="status-text">{t("common.loading")}</p>
        <style>{authStyles}</style>
      </div>
    );
  }

  if (needPhone) {
    return (
      <div className="auth-screen">
        <div className="auth-header">
          <h1>{t("auth.title")}</h1>
          <p>{t("auth.sharePhoneToContinue")}</p>
        </div>
        <p className="auth-hint">
          {t("auth.sharePhoneHint")}
        </p>
        {error && <p className="error-text">{error}</p>}
        <style>{authStyles}</style>
      </div>
    );
  }

  return (
    <div className="auth-screen auth-screen--center">
      {error ? <p className="error-text">{error}</p> : <p className="status-text">{t("common.loading")}</p>}
      <style>{authStyles}</style>
    </div>
  );
}

const authStyles = `
  .auth-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 32px 0;
  }
  .auth-screen--center {
    align-items: center;
    text-align: center;
  }
  .auth-header {
    margin-bottom: 32px;
  }
  .auth-header h1 {
    font-family: "Baloo 2", sans-serif;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 12px;
    color: var(--color-primary);
  }
  .auth-header p {
    color: var(--color-text-secondary);
    font-size: 17px;
    line-height: 1.5;
  }
  .auth-hint {
    font-size: 14px;
    color: var(--color-text-muted);
    margin-top: 8px;
  }
  .auth-form label {
    display: block;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--color-text);
  }
  .auth-form input {
    width: 100%;
    min-height: 48px;
    padding: 14px 18px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: 17px;
    margin-bottom: 20px;
    outline: none;
    transition: border-color var(--transition), box-shadow 0.2s ease;
    background: var(--color-surface);
  }
  .auth-form input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
  }
  .status-text {
    color: var(--color-text-secondary);
    font-size: 17px;
  }
`;
