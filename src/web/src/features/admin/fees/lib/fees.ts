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