import api, { handleApi } from "@/lib/api";
import type {
  BankStatementBatch,
  BankStatementBatchPaginatedResponse,
  EscalationPaginatedResponse,
  ReconciliationEscalation,
} from "@/types/types";

export const fetchBatches = async (
  page: string,
  perPage: string
): Promise<BankStatementBatchPaginatedResponse> => {
  return handleApi<BankStatementBatchPaginatedResponse>(
    api.get(`/v1/reconciliation/batches?page=${page}&per_page=${perPage}`)
  );
};

export const fetchBatchDetail = async (
  batchId: string
): Promise<BankStatementBatch> => {
  return handleApi<BankStatementBatch>(
    api.get(`/v1/reconciliation/batches/${batchId}`)
  );
};

export const uploadBankStatement = async (
  file: File
): Promise<BankStatementBatch> => {
  const formData = new FormData();
  formData.append("file", file);
  return handleApi<BankStatementBatch>(
    api.post("/v1/reconciliation/bank-statements", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
};

export const fetchEscalations = async (
  page: string,
  perPage: string
): Promise<EscalationPaginatedResponse> => {
  return handleApi<EscalationPaginatedResponse>(
    api.get(`/v1/reconciliation/escalations?page=${page}&per_page=${perPage}`)
  );
};

export const resolveEscalation = async (
  escalationId: number,
  data: { action: "confirm" | "fail" | "link"; payment_id?: number; resolution_notes?: string }
): Promise<ReconciliationEscalation> => {
  return handleApi<ReconciliationEscalation>(
    api.post(`/v1/reconciliation/escalations/${escalationId}/resolve`, data)
  );
};

export const getBatchStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "processing":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "failed":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};

export const getTransactionStatusColor = (status: string) => {
  switch (status) {
    case "matched":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "unmatched":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "escalated":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};
