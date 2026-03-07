import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api.ts";
import type { Invoice } from "@/types/index.ts";

export function PaymentScreen() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    api
      .get("/users/me/invoices?status=pending&per_page=50")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const inv = data.find((i: Invoice) => String(i.id) === invoiceId);
        if (inv) {
          setInvoice(inv);
          setAmount(String(inv.final_amount_due ?? ""));
        } else {
          setFetchError("Invoice not found.");
        }
      })
      .catch(() => setFetchError("Failed to load invoice."));
  }, [invoiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !screenshot) {
      setSubmitError("Please select a payment screenshot.");
      return;
    }
    setSubmitError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("invoice_id", String(invoice.id));
      formData.append("amount", amount);
      formData.append("payment_date", paymentDate);
      formData.append("screenshot", screenshot);
      await api.post("/payments/telegram", formData);
      setSuccess(true);
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
      const msg = res?.data?.errors
        ? Object.values(res.data.errors).flat().join(" ")
        : res?.data?.message ?? "Failed to submit payment.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetchError) {
    return (
      <div className="payment-screen payment-screen--centered">
        <p className="error-text">{fetchError}</p>
        <Link to="/invoices" className="btn-primary" style={{ marginTop: 24, textAlign: "center" }}>
          Back to invoices
        </Link>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="payment-screen payment-screen--centered">
        <p className="status-text">Loading invoice...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="payment-screen success-view">
        <div className="success-icon" aria-hidden="true">&#10003;</div>
        <h2>Payment Submitted</h2>
        <p>Your payment is being reviewed. You'll be notified once it's confirmed.</p>
        <button type="button" onClick={() => navigate("/invoices", { replace: true })} className="btn-primary" style={{ marginTop: 24 }}>
          Back to Invoices
        </button>
        <style>{`
          .success-view {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 0;
          }
          .success-icon {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: var(--color-cta);
            color: #fff;
            font-size: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
          }
          .success-view h2 {
            font-family: "Baloo 2", sans-serif;
            font-size: 24px;
            margin-bottom: 12px;
            color: var(--color-text);
          }
          .success-view p {
            color: var(--color-text-secondary);
            font-size: 17px;
            max-width: 300px;
            line-height: 1.5;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="payment-screen">
      <Link to="/invoices" className="back-link">&larr; Back to invoices</Link>

      <h1>Submit Payment</h1>

      <div className="invoice-summary">
        <span className="invoice-label">{invoice.invoice_number}</span>
        <span className="invoice-total">
          {invoice.final_amount_due?.toLocaleString?.() ?? invoice.final_amount_due} ETB
        </span>
      </div>

      <p className="help-text">
        After paying via bank transfer, upload a screenshot of the transaction confirmation.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="amount">Amount (ETB)</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          aria-required="true"
        />

        <label htmlFor="paymentDate">Payment Date</label>
        <input
          id="paymentDate"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
          aria-required="true"
        />

        <label htmlFor="screenshot">Screenshot</label>
        <input
          id="screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
          required
          aria-required="true"
        />

        {submitError && <p className="error-text">{submitError}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Submitting..." : "Submit Payment"}
        </button>
      </form>

      <style>{`
        .payment-screen {
          padding: 24px 0;
          flex: 1;
        }
        .payment-screen--centered {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 48px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          margin-bottom: 20px;
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-secondary);
          transition: color var(--transition);
          cursor: pointer;
        }
        .back-link:hover {
          color: var(--color-primary);
        }
        .payment-screen h1 {
          font-family: "Baloo 2", sans-serif;
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 20px;
          color: var(--color-primary);
        }
        .invoice-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: var(--color-primary-light);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          margin-bottom: 20px;
        }
        .invoice-label {
          font-family: "Baloo 2", sans-serif;
          font-weight: 600;
          font-size: 17px;
          color: var(--color-text);
        }
        .invoice-total {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-cta);
        }
        .help-text {
          font-size: 16px;
          color: var(--color-text-secondary);
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .payment-screen form label {
          display: block;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--color-text);
        }
        .payment-screen form input {
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
        .payment-screen form input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }
        .payment-screen form input[type="file"] {
          padding: 14px;
          font-size: 16px;
          margin-bottom: 24px;
        }
        .status-text {
          color: var(--color-text-secondary);
          text-align: center;
          font-size: 17px;
        }
      `}</style>
    </div>
  );
}
