import { create } from "zustand";
import { EncryptedStorage } from "./EncryptedStorage";
import api from "./api";

export interface User {
  id: number;
  name: string;
  phone: string;
  role: "admin" | "accountant" | "secretary" | "homeowner" | "tenant";
}

interface AuthState {
  user: User | null;
  token?: string;
  setAuth: (user: User, token?: string) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
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

  initAuth: async () => {
    const token = EncryptedStorage.getItem("token");
    if (!token) return;

    try {
      const { data } = await api.get("/auth/me");
      const user: User = {
        id: data.user.id,
        name: `${data.user.first_name} ${data.user.last_name}`,
        phone: data.user.phone,
        role: data.user.role,
      };
      set({ user, token });
    } catch {
      EncryptedStorage.removeItem("token");
      set({ user: null, token: undefined });
    }
  },
}));

