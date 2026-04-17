import api, { handleApi } from "@/lib/api";
import type {
  OutgoingLetter,
  OutgoingLetterPaginatedResponse,
} from "@/types/types";

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export const fetchOutgoingLetters = async (
  page: string,
  perPage: string,
  search = ""
): Promise<OutgoingLetterPaginatedResponse> => {
  try {
    const qs = new URLSearchParams({ page, per_page: perPage });
    if (search) qs.set("search", search);
    const res = await handleApi<OutgoingLetterPaginatedResponse>(
      api.get(`/v1/outgoing-letters?${qs.toString()}`)
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
    console.error("Failed to fetch outgoing letters", err);
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

export const fetchOutgoingLetter = async (id: string | number) => {
  const res = await handleApi<unknown>(
    api.get(`/v1/outgoing-letters/${id}`)
  );
  return unwrapData<OutgoingLetter>(res);
};

export const createOutgoingLetter = (formData: FormData) =>
  handleApi<OutgoingLetter>(api.post("/v1/outgoing-letters", formData)).then(
    (body) => unwrapData<OutgoingLetter>(body)
  );

/** Use POST (not PUT) so PHP receives multipart file uploads; route accepts POST or PUT. */
export const updateOutgoingLetter = (
  id: string | number,
  formData: FormData
) =>
  handleApi<OutgoingLetter>(
    api.post(`/v1/outgoing-letters/${id}`, formData)
  ).then((body) => unwrapData<OutgoingLetter>(body));

export const deleteOutgoingLetter = (id: string | number) =>
  handleApi<{ status: string; message?: string }>(
    api.delete(`/v1/outgoing-letters/${id}`)
  );
