import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { TOKEN_KEY } from "@/lib/api.ts";
import type { Invoice } from "@/types/index.ts";
import { hasPendingPayment } from "@/types/index.ts";
import { LoadingSpinner } from "@/components/loading-spinner.tsx";

export function InvoicesScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<Invoice[]>([]);
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [pendingRes, historyRes] = await Promise.all([
          api.get("/users/me/invoices?status=pending&per_page=50"),
          api.get("/users/me/invoices?status=paid&per_page=20"),
        ]);
        setPending(Array.isArray(pendingRes.data) ? pendingRes.data : pendingRes.data?.data ?? []);
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : historyRes.data?.data ?? []);
      } catch (err: unknown) {
        const res = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
        if (res?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          navigate("/auth", { replace: true });
          return;
        }
        setError(t("invoices.loadError"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, t]);

  const list = tab === "pending" ? pending : history;

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate("/auth", { replace: true });
  };

  return (
    <div className="invoices-screen">
      <div className="invoices-header">
        <h1>{t("invoices.title")}</h1>
        <button onClick={handleLogout} className="btn-link" type="button">{t("common.signOut")}</button>
      </div>

      <div className="tab-bar">
        <button
          type="button"
          className={`tab ${tab === "pending" ? "active" : ""}`}
          onClick={() => setTab("pending")}
          aria-pressed={tab === "pending"}
        >
          {t("invoices.tabPending")}
        </button>
        <button
          type="button"
          className={`tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
          aria-pressed={tab === "history"}
        >
          {t("invoices.tabHistory")}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label={t("common.loading")} />
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : list.length === 0 ? (
        <p className="status-text">
          {tab === "pending" ? t("invoices.noPending") : t("invoices.noHistory")}
        </p>
      ) : (
        <div className="invoice-list">
          {list.map((inv) => {
            const isPendingPayment = tab === "pending" && hasPendingPayment(inv);
            return (
              <div key={inv.id} className="invoice-card">
                <div className="invoice-row">
                  <span className="invoice-number">{inv.invoice_number}</span>
                  <span className="invoice-amount">
                    {inv.status === "paid" ? inv.amount_paid?.toLocaleString?.() ?? inv.amount_paid : inv.final_amount_due?.toLocaleString?.() ?? inv.final_amount_due } ETB
                  </span>
                </div>
                <div className="invoice-meta">
                  {inv.invoice_type} &middot; {t("invoices.due")} {inv.due_date ?? "—"}
                </div>
                {tab === "pending" && (
                  isPendingPayment ? (
                    <button type="button" disabled className="btn-secondary-disabled">
                      {t("invoices.pendingApproval")}
                    </button>
                  ) : (
                    <Link to={`/payment/${inv.id}`} className="btn-primary btn-sm">
                      {t("invoices.payNow")}
                    </Link>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .invoices-screen {
          padding: 24px 0;
          flex: 1;
        }
        .invoices-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .invoices-header h1 {
          font-family: "Baloo 2", sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--color-primary);
        }
        .tab-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .tab {
          min-height: var(--touch-min);
          padding: 12px 24px;
          border-radius: var(--radius-full);
          border: 2px solid var(--color-border);
          background: var(--color-surface);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-secondary);
          transition: background-color var(--transition), border-color var(--transition), color var(--transition);
          cursor: pointer;
        }
        .tab:hover {
          border-color: var(--color-secondary);
          color: var(--color-text);
        }
        .tab.active {
          background: var(--color-primary-light);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        .invoice-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .invoice-card {
          padding: 20px;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          box-shadow: 0 2px 12px rgba(212, 175, 55, 0.12);
          transition: border-color var(--transition), box-shadow var(--transition);
        }
        .invoice-card:hover {
          border-color: var(--color-border-strong);
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.18);
        }
        .invoice-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .invoice-number {
          font-family: "Baloo 2", sans-serif;
          font-weight: 600;
          font-size: 17px;
          color: var(--color-text);
        }
        .invoice-amount {
          font-weight: 700;
          font-size: 18px;
          color: var(--color-cta);
        }
        .invoice-meta {
          font-size: 15px;
          color: var(--color-text-muted);
          margin-bottom: 16px;
        }
        .invoice-card .btn-sm {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          border-radius: var(--radius);
        }
        .status-text {
          color: var(--color-text-secondary);
          text-align: center;
          padding: 48px 0;
          font-size: 17px;
        }
      `}</style>
    </div>
  );
}
