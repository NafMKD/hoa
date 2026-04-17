import api, { handleApi } from "@/lib/api";
import type {
  DocumentTemplate,
  DocumentTemplatePaginatedResponse,
} from "@/types/types";

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export type FetchDocumentTemplatesParams = {
  page: string;
  perPage: string;
  search?: string;
  category?: string;
  /** created_at sort order */
  order?: "asc" | "desc";
};

/**
 * Fetch paginated document templates with optional search, category filter, and sort.
 */
export const fetchDocumentTemplates = async (
  params: FetchDocumentTemplatesParams
): Promise<DocumentTemplatePaginatedResponse> => {
  const { page, perPage, search = "", category = "", order = "desc" } = params;
  try {
    const qs = new URLSearchParams({
      page,
      per_page: perPage,
      order,
    });
    if (search) qs.set("search", search);
    if (category) qs.set("category", category);

    const res = await handleApi<DocumentTemplatePaginatedResponse>(
      api.get(`/v1/document-templates?${qs.toString()}`)
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
    console.error("Failed to fetch document templates", err);
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

/**
 * Fetch single template detail by ID
 */
export const fetchDocumentTemplateDetail = async (templateId: string) => {
  const res = await handleApi<unknown>(
    api.get(`/v1/document-templates/${templateId}`)
  );
  return unwrapData<DocumentTemplate>(res);
};

/**
 * Create a new document template
 */
export const createDocumentTemplate = async (formData: FormData) => {
  const res = await handleApi<unknown>(
    api.post("/v1/document-templates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
  return unwrapData<DocumentTemplate>(res);
};

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
  ).then((body) => unwrapData<DocumentTemplate>(body));

/**
 * Delete a document template
 */
export const deleteDocumentTemplate = (templateId: string | number) =>
  handleApi<void>(api.delete(`/v1/document-templates/${templateId}`));

/**
 * Download the `.docx` file for a template (browser save).
 */
export async function downloadDocumentTemplateFile(
  templateId: string | number,
  filenameBase: string
): Promise<void> {
  const res = await api.get(`/v1/document-templates/${templateId}/download`, {
    responseType: "blob",
  });
  const blob = res.data as Blob;
  if (blob.type && blob.type.includes("application/json")) {
    const text = await blob.text();
    try {
      const json = JSON.parse(text) as { message?: string };
      throw new Error(json.message || "Download failed");
    } catch (e) {
      if (e instanceof Error && e.message !== "Download failed") {
        throw new Error("Download failed");
      }
      throw e;
    }
  }
  const name = filenameBase.endsWith(".docx")
    ? filenameBase
    : `${filenameBase}.docx`;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
}
