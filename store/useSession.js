import { create } from "zustand";

export const useSession = create((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("no session");
      const data = await res.json();
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    set({ user: null });
  },
}));
