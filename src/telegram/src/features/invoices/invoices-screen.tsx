import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { TOKEN_KEY } from "@/lib/api.ts";
import type { Invoice } from "@/types/index.ts";

export function InvoicesScreen() {
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
        setError(res?.data?.message ?? "Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const list = tab === "pending" ? pending : history;

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate("/auth", { replace: true });
  };

  return (
    <div className="invoices-screen">
      <div className="invoices-header">
        <h1>My Invoices</h1>
        <button onClick={handleLogout} className="btn-link">Sign out</button>
      </div>

      <div className="tab-bar">
        <button
          className={`tab ${tab === "pending" ? "active" : ""}`}
          onClick={() => setTab("pending")}
        >
          Pending
        </button>
        <button
          className={`tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </div>

      {loading ? (
        <p className="status-text">Loading...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : list.length === 0 ? (
        <p className="status-text">
          {tab === "pending" ? "No pending invoices." : "No payment history."}
        </p>
      ) : (
        <div className="invoice-list">
          {list.map((inv) => (
            <div key={inv.id} className="invoice-card">
              <div className="invoice-row">
                <span className="invoice-number">{inv.invoice_number}</span>
                <span className="invoice-amount">
                  {inv.status === "paid" ? inv.amount_paid?.toLocaleString?.() ?? inv.amount_paid : inv.final_amount_due?.toLocaleString?.() ?? inv.final_amount_due } ETB
                </span>
              </div>
              <div className="invoice-meta">
                {inv.invoice_type} &middot; Due {inv.due_date ?? "—"}
              </div>
              {tab === "pending" && (
                <Link to={`/payment/${inv.id}`} className="btn-primary btn-sm">
                  Pay Now
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .invoices-screen {
          padding: 20px 0;
          flex: 1;
        }
        .invoices-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .invoices-header h1 {
          font-size: 22px;
          font-weight: 700;
        }
        .tab-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .tab {
          padding: 8px 18px;
          border-radius: 20px;
          border: 1px solid var(--color-border);
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all 0.15s;
        }
        .tab.active {
          background: var(--color-primary-light);
          border-color: var(--color-primary);
          color: var(--color-primary);
          font-weight: 600;
        }
        .invoice-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .invoice-card {
          padding: 16px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
        }
        .invoice-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }
        .invoice-number {
          font-weight: 600;
          font-size: 15px;
        }
        .invoice-amount {
          font-weight: 700;
          color: var(--color-primary);
          font-size: 15px;
        }
        .invoice-meta {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-bottom: 12px;
        }
        .btn-sm {
          display: inline-block;
          padding: 10px 20px;
          font-size: 14px;
        }
        .status-text {
          color: var(--color-text-secondary);
          text-align: center;
          padding: 40px 0;
        }
      `}</style>
    </div>
  );
}
