import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send cookies for session
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  // Ensure headers exist as AxiosHeaders
  config.headers = config.headers ?? new axios.AxiosHeaders();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

export default api;
