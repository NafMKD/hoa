import axios from "axios";
import { EncryptedStorage } from "@/stores/EncryptedStorage";
import type { AxiosError } from "axios";
import type { ApiError } from "@/types/api-error";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: "application/json", 
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = EncryptedStorage.getItem("token");

  // Ensure headers exist as AxiosHeaders
  config.headers = config.headers ?? new axios.AxiosHeaders();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});


export async function handleApi<T>(promise: Promise<{ data: T }>): Promise<T> {
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

export default api;