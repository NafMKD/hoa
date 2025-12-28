import api, { handleApi } from "@/lib/api";
import type { Payment, PaymentPaginatedResponse } from "@/types/types"; 

export const fetchPayments = async (
  page: string,
  perPage: string,
  search = ""
): Promise<PaymentPaginatedResponse> => {
  return handleApi<PaymentPaginatedResponse>(
    api.get(`/v1/payments?page=${page}&per_page=${perPage}&search=${search}`)
  );
};

export const createPayment = (data: unknown) => 
  handleApi<Payment>(api.post("/v1/payments", data));

export const fetchPaymentDetail = (paymentId: string) =>
  handleApi<Payment>(api.get(`/v1/payments/${paymentId}`));

export const confirmPayment = (paymentId: number) =>
  handleApi<Payment>(api.post(`/v1/payments/${paymentId}/confirm`)); 

export const failPayment = (paymentId: number) =>
  handleApi<Payment>(api.post(`/v1/payments/${paymentId}/fail`));

export const refundPayment = (paymentId: number) =>
  handleApi<Payment>(api.post(`/v1/payments/${paymentId}/refund`));

export const addReceiptNumber = (paymentId: number, receiptNumber: string) =>
  handleApi<Payment>(api.post(`/v1/payments/${paymentId}/add_receipt_number`, { receipt_number: receiptNumber }));

export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "failed":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "refunded":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};