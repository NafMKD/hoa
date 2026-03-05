export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: string;
  final_amount_due: number;
  issue_date: string;
  due_date: string | null;
  total_amount: number;
  amount_paid: number;
  penalty_amount: number;
  status: string;
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
