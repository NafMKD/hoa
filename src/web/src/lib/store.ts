import { create } from "zustand";

export interface User {
  id: number;
  name: string;
  phone: string;
  role: "admin" | "user";
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user: User) => set({ user }),
  logout: () => set({ user: null }),
}));
