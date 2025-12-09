import api, { handleApi } from "@/lib/api";
import type { Unit, UnitLeaseResource, UnitPaginatedResponse } from "@/types/types";

/**
 * Fetch paginated units
 */
export const fetchUnits = async (
  page: string,
  perPage: string,
  search = ""
): Promise<UnitPaginatedResponse> => {
  try {
    const res = await handleApi<UnitPaginatedResponse>(
      api.get(`/v1/units?page=${page}&per_page=${perPage}&search=${search}`)
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
    console.error("Failed to fetch units", err);
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
 * Fetch unit detail by ID
 */
export const fetchUnitDetail = (unitId: string) =>
  handleApi<Unit>(api.get(`/v1/units/${unitId}`));

/**
 * Create a new unit
 */
export const createUnit = (formData: FormData) =>
  handleApi<Unit>(
    api.post("/v1/units", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

/**
 * Update existing unit
 */
export const updateUnit = (unitId: string | number, formData: FormData) =>
  handleApi<Unit>(api.put(`/v1/units/${unitId}`, formData));

/**
 * Delete a unit
 */
export const deleteUnit = (unitId: string | number) =>
  handleApi<void>(api.delete(`/v1/units/${unitId}`));

/**
 * Change status
 */
export const changeUnitStatus = (unitId: string | number, status: string) =>
  handleApi<Unit>(
    api.post(`/v1/units/${unitId}/status`, { status: status })
  );

/**
 * Fetch unit lease details
 */
export const fetchUnitLeaseDetail = (unitId: string, leaseId: string) =>
  handleApi<UnitLeaseResource>(
    api.get(`/v1/units/${unitId}/leases/${leaseId}`)
  );

/**
 * Activate unit lease
 */
export const activateUnitLease = (unitId: string, leaseId: string) =>
  handleApi<UnitLeaseResource>(
    api.post(`/v1/units/${unitId}/leases/${leaseId}/activate`)
  );

/**
 * Terminate unit lease
 */
export const terminateUnitLease = (unitId: string, leaseId: string) =>
  handleApi<UnitLeaseResource>(
    api.post(`/v1/units/${unitId}/leases/${leaseId}/terminate`)
  );

/**
 * Import units from file
 */
export const importUnits = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return handleApi<{
    message?: string;
    failed?: Array<
      | { name?: string; unit_name?: string; phone?: string; reason?: string }
      | string
    >;
  }>(
    api.post("/v1/import/units", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};
  
