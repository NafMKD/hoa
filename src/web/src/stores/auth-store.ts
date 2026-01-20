import { create } from "zustand";
import { EncryptedStorage } from "./EncryptedStorage";
import api from "@/lib/api";
import { router } from "@/QueryClient";

export interface User {
  id: number;
  name: string;
  phone: string;
  role:
    | "admin"
    | "accountant"
    | "secretary"
    | "homeowner"
    | "tenant"
    | "representative";
}

interface AuthState {
  user: User | null;
  token?: string;
  setAuth: (user: User, token?: string) => void;
  logout: () => void;
  initAuth: (redirect?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: undefined,

  setAuth: (user: User, token?: string) => {
    if (token) EncryptedStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    EncryptedStorage.removeItem("token");
    set({ user: null, token: undefined });
  },

  initAuth: async (redirect?: string) => {
    const token = EncryptedStorage.getItem("token");
    if (!token) return;

    try {
      const { data } = await api.get("/v1/auth/me");
      const user: User = {
        id: data.user.id,
        name: `${data.user.first_name} ${data.user.last_name}`,
        phone: data.user.phone,
        role: data.user.role,
      };
      set({ user, token });
      if (redirect) {
        router.history.push(redirect);
      } else {
        router.navigate({ to: `/${user.role}` });
      }
    } catch {
      EncryptedStorage.removeItem("token");
      set({ user: null, token: undefined });
    }
  },
}));
