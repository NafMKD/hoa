import axios from "axios";
import { EncryptedStorage } from "@/stores/EncryptedStorage";

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

export default api;