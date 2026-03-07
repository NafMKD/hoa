import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { TOKEN_KEY } from "@/lib/api.ts";

export function AuthScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setError("");
    const phoneToUse = phone.trim();

    if (!phoneToUse) {
      setError(t("auth.errorRequired"));
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/telegram", {
        init_data: "dev_bypass",
        phone: phoneToUse,
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      navigate("/invoices", { replace: true });
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string }; status?: number } })?.response;
      if (res?.status === 404) {
        setError(t("auth.errorNotFound"));
      } else if (res?.status === 401) {
        setError(t("auth.errorInvalid"));
      } else {
        setError(res?.data?.message ?? t("auth.errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

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

      <style>{`
        .auth-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 32px 0;
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
      `}</style>
    </div>
  );
}
