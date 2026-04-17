import api, { handleApi } from "@/lib/api";

/**
 * Submit lease agreement for processing
 */
export const submitLeaseAgreement = async(unitId: string, formData: FormData) => {
  const res = await handleApi<any>(
    api.post(`/v1/units/${unitId}/leases`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

  return res.data;
}
