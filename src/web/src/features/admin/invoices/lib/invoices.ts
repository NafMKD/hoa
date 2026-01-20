import api, { handleApi } from "@/lib/api";
import type { Invoice, InvoicePaginatedResponse, InvoiceSelectOption, PenaltyPayload } from "@/types/types";

export const fetchInvoices = async (
  page: string,
  perPage: string,
  search = ""
): Promise<InvoicePaginatedResponse> => {
  return handleApi<InvoicePaginatedResponse>(
    api.get(`/v1/invoices?page=${page}&per_page=${perPage}&search=${search}`)
  );
};

export const fetchInvoiceDetail = (invoiceId: string) =>
  handleApi<Invoice>(api.get(`/v1/invoices/${invoiceId}`));

export const searchInvoices = async (query: string, status?: string[] ): Promise<InvoiceSelectOption> =>
  handleApi<InvoiceSelectOption>(api.get(`/v1/invoices/search`, {
    params: { term: query, status: status },
  }));

export const createInvoicePenalties = (formData: PenaltyPayload) =>
  handleApi<Invoice>(api.post(`/v1/invoices/${formData.invoice_id}/penalties`, {
    penalties: formData.penalties
  }));
  
// Helper to get status colors
export const getStatusColor = (status: string) => {
  switch (status) {
    case "issued":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    case "partial":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "paid":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "overdue":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "cancelled":
      return "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};
