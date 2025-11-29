import api, { handleApi } from "@/lib/api";
import type { UnitOwnership } from "@/types/types";

/**
 * Create a new ownership 
 */
export const createOwnership = (unitID: number, formData: FormData) =>
  handleApi<UnitOwnership>(
    api.post(`/v1/units/${unitID}/owners`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );