import api, { handleApi } from "@/lib/api";
import type { IdNamePair, User, UserPaginatedResponse, UserSelectOption } from "@/types/types";

export const fetchUsers = async (
  page: string,
  perPage: string,
  search = ""
): Promise<UserPaginatedResponse> => {
  try {
    const res = await handleApi<UserPaginatedResponse>(
      api.get(`/v1/users?page=${page}&per_page=${perPage}&search=${search}`)
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
    console.error("Failed to fetch buildings", err);
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

export const createUser = (formData: FormData) =>
  handleApi<User>(
    api.post("/v1/users", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

export const deleteUser = (userId: string | number) =>
  handleApi<void>(api.delete(`/v1/users/${userId}`));

export const fetchUserDetail = (userId: string) =>
  handleApi<User>(api.get(`/v1/users/${userId}`));

export const updateUserStatus = (userId: string, status: string) =>
  handleApi<User>(api.patch(`/v1/users/${userId}/status`, { status }));

export const updateUser = (userID: string | number, data: FormData) =>
  handleApi<User>(
    api.post(`/v1/users/${userID}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

export const fetchUserNames = async (): Promise<IdNamePair[]> =>
  handleApi<IdNamePair[]>(api.get(`/v1/users/names/all`));

export const searchUsers = async (query: string, role?: string, status?:string ): Promise<UserSelectOption> =>
  handleApi<UserSelectOption>(api.get(`/v1/users/search`, {
    params: { term: query, role: role, status: status },
  }));

export const importUsers = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return handleApi<{
    message?: string;
    failed?: Array<{ phone: string; reason?: string } | string>;
  }>(
    api.post("/v1/import/users", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );
};
  