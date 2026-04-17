import api, { handleApi } from "@/lib/api";
import type { Complaint, ComplaintPaginatedResponse } from "@/types/types";

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export const fetchComplaints = async (
  page: string,
  perPage: string,
  search = "",
  status = "",
  category = ""
): Promise<ComplaintPaginatedResponse> => {
  try {
    const qs = new URLSearchParams({ page, per_page: perPage });
    if (search) qs.set("search", search);
    if (status) qs.set("status", status);
    if (category) qs.set("category", category);
    const res = await handleApi<ComplaintPaginatedResponse>(
      api.get(`/v1/complaints?${qs.toString()}`)
    );
    return {
      data: Array.isArray(res.data) ? res.data : [],
      meta: {
        current_page: res?.meta?.current_page ?? 1,
        per_page: res?.meta?.per_page ?? parseInt(perPage, 10),
        total: res?.meta?.total ?? 0,
        last_page: res?.meta?.last_page ?? 1,
      },
    };
  } catch (err) {
    console.error("Failed to fetch complaints", err);
    return {
      data: [],
      meta: {
        current_page: 1,
        per_page: parseInt(perPage, 10),
        total: 0,
        last_page: 1,
      },
    };
  }
};

export const fetchComplaint = async (complaintId: string | number) => {
  const res = await handleApi<unknown>(api.get(`/v1/complaints/${complaintId}`));
  return unwrapData<Complaint>(res);
};

export const createComplaint = (formData: FormData) =>
  handleApi<Complaint>(
    api.post("/v1/complaints", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).then((body) => unwrapData<Complaint>(body));

export const updateComplaint = (complaintId: string | number, formData: FormData) =>
  handleApi<Complaint>(
    api.put(`/v1/complaints/${complaintId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).then((body) => unwrapData<Complaint>(body));

export const deleteComplaint = (complaintId: string | number) =>
  handleApi<{ status: string; message?: string }>(
    api.delete(`/v1/complaints/${complaintId}`)
  );
