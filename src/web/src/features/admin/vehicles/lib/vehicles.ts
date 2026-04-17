import api, { handleApi } from "@/lib/api";
import type {
  StickerIssue,
  StickerPrintData,
  Vehicle,
  VehiclePaginatedResponse,
} from "@/types/types";

/**
 * Fetch paginated vehicles from the API.
 */
export const fetchVehicles = async (
  page: string,
  perPage: string,
  search = ""
): Promise<VehiclePaginatedResponse> => {
  try {
    const res = await handleApi<VehiclePaginatedResponse>(
      api.get(`/v1/vehicles?page=${page}&per_page=${perPage}&search=${search}`)
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
    console.error("Failed to fetch vehicles", err);
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

/**
 * Fetch single vehicle detail.
 */
export const fetchVehicleDetail = (vehicleId: string) =>
  handleApi<Vehicle>(api.get(`/v1/vehicles/${vehicleId}`));

/**
 * Create a vehicle. Expecting FormData (for potential file/document uploads).
 */
export const createVehicle = (formData: FormData) =>
  handleApi<Vehicle>(
    api.post("/v1/vehicles", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

/**
 * Update a vehicle. Expecting FormData.
 */
export const updateVehicle = (vehicleId: string | number, formData: FormData) =>
  handleApi<Vehicle>(
    api.post(`/v1/vehicles/${vehicleId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

/**
 * Soft-delete a vehicle.
 */
export const deleteVehicle = (vehicleId: string | number) =>
  handleApi<void>(api.delete(`/v1/vehicles/${vehicleId}`));

export const issueSticker = (
  vehicleId: string | number,
  body?: {
    expires_at?: string | null;
    supersedes_sticker_issue_id?: number | null;
  }
) =>
  handleApi<StickerIssue>(
    api.post(`/v1/vehicles/${vehicleId}/sticker-issues`, body ?? {})
  );

export const revokeSticker = (stickerIssueId: string | number) =>
  handleApi<StickerIssue>(
    api.post(`/v1/sticker-issues/${stickerIssueId}/revoke`, {})
  );

export const markStickerLost = (
  stickerIssueId: string | number,
  body?: { fee_id?: number | null }
) =>
  handleApi<StickerIssue>(
    api.post(`/v1/sticker-issues/${stickerIssueId}/mark-lost`, body ?? {})
  );

export const markStickerReturned = (stickerIssueId: string | number) =>
  handleApi<StickerIssue>(
    api.post(`/v1/sticker-issues/${stickerIssueId}/mark-returned`, {})
  );

export const fetchStickerPrintData = (stickerIssueId: string | number) =>
  handleApi<StickerPrintData>(
    api.get(`/v1/sticker-issues/${stickerIssueId}/print-data`)
  );

export const fetchPendingStickerReplacements = async (
  vehicleId: string | number
): Promise<StickerIssue[]> => {
  const res = await handleApi<unknown>(
    api.get(`/v1/vehicles/${vehicleId}/sticker-issues/pending-replacements`)
  );
  if (Array.isArray(res)) {
    return res;
  }
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    Array.isArray((res as { data: unknown }).data)
  ) {
    return (res as { data: StickerIssue[] }).data;
  }
  return [];
};
