import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types/auth.types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;

  // Actions
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      // Called after successful login or registration
      setAuth: (user, token) => set({ user, token }),
      // Called on logout
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: "auth", // key used in the cookie
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          const match = document.cookie.match(
            new RegExp(`(?:^|; )${key}=([^;]*)`),
          );
          return match ? decodeURIComponent(match[1]) : null;
        },
        setItem: (key, value) => {
          // Write cookie: 7-day expiry, SameSite=Strict prevents CSRF
          // Not httpOnly because JS must read it (Option A decision)
          document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${7 * 24 * 60 * 60}; path=/; SameSite=Strict`;
        },
        removeItem: (key) => {
          // Expire the cookie immediately to delete it
          document.cookie = `${key}=; max-age=0; path=/`;
        },
      })),
      // Only persist these fields — no need to persist actions
      partialize: (state: AuthState) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
