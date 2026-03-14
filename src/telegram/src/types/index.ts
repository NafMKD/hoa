export interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  receipt_number?: string | null;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
}

/** Invoice metadata from backend (e.g. invoice_snapshot.invoice_months) */
export interface InvoiceMetadata {
  invoice_snapshot?: {
    invoice_months?: string[];
  };
  fee_snapshot?: {
    name?: string;
    category?: string;
    amount?: number;
  };
  legacy?: boolean;
  [key: string]: unknown;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: string;
  is_mine?: boolean;
  is_unit_owner?: boolean;
  final_amount_due: number;
  issue_date: string;
  due_date: string | null;
  total_amount: number;
  amount_paid: number;
  penalty_amount: number;
  status: string;
  metadata?: InvoiceMetadata;
  payments?: Payment[];
}

export interface InvoiceResponse {
  data: Invoice[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/** True if invoice has at least one payment with status "pending" */
export function hasPendingPayment(inv: Invoice): boolean {
  return Array.isArray(inv.payments) && inv.payments.some((p) => p.status === "pending");
}

/** Invoice months from metadata (e.g. ["September/2026", "October/2026"]) */
export function getInvoiceMonths(inv: Invoice): string[] {
  return inv.metadata?.invoice_snapshot?.invoice_months ?? [];
}
