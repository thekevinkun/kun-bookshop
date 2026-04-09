// Import React Query hooks for data fetching and mutations
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../store/auth";

import type { User } from "../types/auth";

// Import our configured Axios instance
import api from "../lib/api";

// Profile update mutation
// Calls PUT /api/auth/update-profile — updates firstName, lastName, emailPreferences
export const useUpdateProfile = () => {
  const queryClient = useQueryClient(); // Access the query cache to invalidate stale data

  return useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      emailPreferences?: {
        marketing: boolean;
        orderUpdates: boolean;
        newReleases: boolean;
        priceDrops: boolean;
      };
    }) => {
      const response = await api.put("/auth/update-profile", data);
      return response.data as { user: User }; // Use the User type instead of any
    },
    onSuccess: (data) => {
      useAuthStore.getState().updateUser(data.user); // updateUser — not setUser
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

// Change password mutation
// Calls PUT /api/auth/change-password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string; // Must match what's stored (backend verifies with bcrypt)
      newPassword: string; // Must pass strength requirements
      confirmNewPassword: string; // Must match newPassword (also validated client-side)
    }) => {
      const response = await api.put("/auth/change-password", data); // PUT /api/auth/change-password
      return response.data as { message: string }; // Backend returns a success message
    },
    // No cache invalidation needed — password change doesn't affect any cached query data
  });
};
