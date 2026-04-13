// Import create and persist from Zustand
// create: makes the store, persist: saves it to localStorage so login survives page refresh
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Import our TypeScript types for the auth store
import type { AuthState } from "../types/auth";

// Create the store with persist middleware
// persist automatically saves the store to localStorage under the key 'auth-storage'
// and rehydrates it when the page loads — so the user stays logged in after refresh
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // INITIAL STATE
      user: null,
      token: null,
      isAuthenticated: false,

      // LOGIN ACTION
      // Call this right after a successful POST /api/auth/login response
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true, // Mark as authenticated so ProtectedRoute lets them through
        }),

      // LOGOUT ACTION
      // Call this after POST /api/auth/logout — clears everything from the store
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      // UPDATE USER ACTION
      // Call this after PUT /api/auth/update-profile — merges new data into existing user
      // Partial<User> means any subset of User fields — we only update what changed
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
          // If somehow user is null, don't create a partial user — keep it null
        })),

      // SET TOKEN ACTION
      // Call this after POST /api/auth/refresh — updates the token without touching user data
      setToken: (token) => set({ token }),
    }),
    {
      name: "auth-storage", // The localStorage key this store is saved under
      // Only persist user and token — isAuthenticated is derived, so we recompute it on load
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
