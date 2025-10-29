import api from "@/lib/api";
import type { AxiosError } from "axios";
import type { User, UserPaginatedResponse } from "@/types/user";
import type { ApiError } from "@/types/api-error";

async function handleApi<T>(promise: Promise<{ data: T }>): Promise<T> {
  try {
    const response = await promise;
    return response.data;
  } catch (err) {
    const error = err as AxiosError;
    throw {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    } as ApiError;
  }
}

export const fetchUsers = (page: string, perPage: string, search = "") =>
  handleApi<UserPaginatedResponse>(
    api.get(`/v1/users?page=${page}&per_page=${perPage}&search=${search}`)
  );

export const createUser = (formData: FormData) =>
  handleApi<User>(
    api.post("/v1/users", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

export const deleteUser = (userId: string | number) =>
  handleApi<void>(api.delete(`/v1/users/${userId}`));
