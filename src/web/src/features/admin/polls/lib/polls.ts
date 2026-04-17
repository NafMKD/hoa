import api, { handleApi } from "@/lib/api";
import type {
  Poll,
  PollPaginatedResponse,
  PollResultsResponse,
} from "@/types/types";

/** Laravel JsonResource wraps single resources in `{ data: ... }`. */
function unwrapData<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export const fetchPolls = async (
  page: string,
  perPage: string,
  search = "",
  status = ""
): Promise<PollPaginatedResponse> => {
  try {
    const qs = new URLSearchParams({ page, per_page: perPage });
    if (search) qs.set("search", search);
    if (status) qs.set("status", status);
    const res = await handleApi<PollPaginatedResponse>(
      api.get(`/v1/polls?${qs.toString()}`)
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
    console.error("Failed to fetch polls", err);
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

export const fetchPoll = async (pollId: string | number) => {
  const res = await handleApi<unknown>(api.get(`/v1/polls/${pollId}`));
  return unwrapData<Poll>(res);
};

export type SavePollBody = {
  title: string;
  description?: string | null;
  eligible_scope?: Record<string, unknown> | null;
  start_at: string;
  end_at: string;
  options: { option_text: string; order?: number }[];
};

export const createPoll = async (body: SavePollBody) => {
  const res = await handleApi<unknown>(api.post("/v1/polls", body));
  return unwrapData<Poll>(res);
};

export const updatePoll = async (
  pollId: string | number,
  body: Partial<SavePollBody>
) => {
  const res = await handleApi<unknown>(api.put(`/v1/polls/${pollId}`, body));
  return unwrapData<Poll>(res);
};

export const deletePoll = (pollId: string | number) =>
  handleApi<{ status: string; message?: string }>(
    api.delete(`/v1/polls/${pollId}`)
  );

export const openPoll = async (pollId: string | number) => {
  const res = await handleApi<unknown>(
    api.post(`/v1/polls/${pollId}/open`, {})
  );
  return unwrapData<Poll>(res);
};

export const closePoll = async (pollId: string | number) => {
  const res = await handleApi<unknown>(
    api.post(`/v1/polls/${pollId}/close`, {})
  );
  return unwrapData<Poll>(res);
};

export const fetchPollResults = (pollId: string | number) =>
  handleApi<PollResultsResponse>(api.get(`/v1/polls/${pollId}/results`));
