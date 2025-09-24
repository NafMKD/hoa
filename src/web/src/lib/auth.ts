import api from "./api";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    phone: string;
    role: "admin" | "user";
  };
}

// login
export async function login(phone: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { phone, password });
  return data;
}

// logout
export async function logout(): Promise<void> {
  await api.post("/auth/logout");
  localStorage.removeItem("access_token");
}
