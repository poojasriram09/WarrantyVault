import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  dbUser: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setDbUser: (dbUser) => set({ dbUser }),
  logout: () => set({ user: null, dbUser: null }),
}));
