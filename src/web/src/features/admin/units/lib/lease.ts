import api, { handleApi } from "@/lib/api";
import type { DocumentTemplatePaginatedResponse, UnitLeaseResource } from "@/types/types";

/**
 * Fetch lease document templates
 */
export const fetchLeaseTemplates = () => 
  handleApi<DocumentTemplatePaginatedResponse>(api.get(`/v1/document-templates/all`, { params: { category : 'lease_agreement' }}));

/**
 * Submit lease agreement for processing
 */
export const submitLeaseAgreement = (unitId: string, formData: FormData) =>
  handleApi<UnitLeaseResource>(
    api.post(`/v1/units/${unitId}/leases`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
