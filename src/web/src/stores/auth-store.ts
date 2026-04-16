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

const ALLOWED_ROLES: User["role"][] = [
  "admin",
  "accountant",
  "secretary",
  "homeowner",
  "tenant",
  "representative",
];

/** API may return role with different casing; admin layout checks use exact lowercase. */
export function normalizeUserRole(role: unknown): User["role"] {
  if (typeof role !== "string") return "tenant";
  const r = role.trim().toLowerCase() as User["role"];
  return ALLOWED_ROLES.includes(r) ? r : "tenant";
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
        role: normalizeUserRole(data.user.role),
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
