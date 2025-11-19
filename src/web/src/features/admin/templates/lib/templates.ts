import api, { handleApi } from "@/lib/api";
import type {
  DocumentTemplate,
  DocumentTemplatePaginatedResponse,
} from "@/types/types";

/**
 * Fetch paginated document templates with optional search
 */
export const fetchDocumentTemplates = async (
  page: string,
  perPage: string,
  search = ""
): Promise<DocumentTemplatePaginatedResponse> => {
  try {
    const res = await handleApi<DocumentTemplatePaginatedResponse>(
      api.get(
        `/v1/document-templates?page=${page}&per_page=${perPage}&search=${search}`
      )
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
    console.error("Failed to fetch document templates", err);
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
 * Fetch single template detail by ID
 */
export const fetchDocumentTemplateDetail = (templateId: string) =>
  handleApi<DocumentTemplate>(api.get(`/v1/document-templates/${templateId}`));

/**
 * Create a new document template
 */
export const createDocumentTemplate = (formData: FormData) =>
  handleApi<DocumentTemplate>(
    api.post("/v1/document-templates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

/**
 * Update an existing document template
 */
export const updateDocumentTemplate = (
  templateId: string | number,
  formData: FormData
) =>
  handleApi<DocumentTemplate>(
    api.put(`/v1/document-templates/${templateId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

/**
 * Delete a document template
 */
export const deleteDocumentTemplate = (templateId: string | number) =>
  handleApi<void>(api.delete(`/v1/document-templates/${templateId}`));

/**
 * Download a document template file
 */
export const downloadDocumentTemplate = async (templateId: string | number) => {
  const res = await handleApi<Blob>(
    api.get(`/v1/document-templates/${templateId}/download`, {
      responseType: "blob",
    })
  );
  return res;
}