import api, { handleApi } from "@/lib/api";
import type { Fee, FeePaginatedResponse } from "@/types/types";

export const fetchFees = async (
  page: string,
  perPage: string,
  search = ""
): Promise<FeePaginatedResponse> => {
  try {
    const res = await handleApi<FeePaginatedResponse>(
      api.get(`/v1/fees?page=${page}&per_page=${perPage}&search=${search}`)
    );

    return {
      data: Array.isArray(res.data) ? res.data : [],
      meta: {
        current_page: res?.meta?.current_page ?? 1,
        per_page: res?.meta?.per_page ?? parseInt(perPage),
        total: res?.meta?.total ?? 0,
        last_page: res?.meta?.last_page ?? 1,
      },
    };
  } catch (err) {
    console.error("Failed to fetch fees", err);
    return {
      data: [],
      meta: {
        current_page: 1,
        per_page: parseInt(perPage),
        total: 0,
        last_page: 1,
      },
    };
  }
};

export const fetchFeeDetail = (feeId: string) =>
  handleApi<Fee>(api.get(`/v1/fees/${feeId}`));

export const createFee = (formData: FormData) =>
  handleApi<Fee>(
    api.post("/v1/fees", formData)
  );

export const updateFee = (feeId: string | number, formData: FormData) =>
  handleApi<Fee>(
    api.put(`/v1/fees/${feeId}`, formData)
  );

export const deleteFee = (feeId: string | number) =>
  handleApi<void>(api.delete(`/v1/fees/${feeId}`));

export const terminate = (feeId: string | number) =>
  handleApi<Fee>(api.post(`/v1/fees/${feeId}/terminate`));

export const getFeeStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "terminated":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};