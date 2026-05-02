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

// Upload avatar mutation
// Calls POST /api/auth/upload-avatar — sends a cropped image as FormData
// The blob comes from the frontend canvas after the user finishes cropping
export const useUploadAvatar = () => {
  return useMutation({
    mutationFn: async (croppedBlob: Blob) => {
      // Wrap the blob in FormData — multipart/form-data is required for file uploads
      // Field name must be 'avatar' — matches the multer field name on the backend
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.jpg"); // Filename is cosmetic for multer

      // Content-Type must be set explicitly — axios sometimes drops the multipart boundary
      // when it auto-detects FormData, causing multer to see an empty req.files
      const response = await api.post("/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data as { user: User; message: string };
    },
    onSuccess: (data) => {
      // Merge the new avatar URL into Zustand — Navbar re-renders instantly
      useAuthStore.getState().updateUser({ avatar: data.user.avatar });
    },
  });
};

// Remove avatar mutation
// Calls DELETE /api/auth/avatar — clears avatar from Cloudinary and the user document
// After success, Zustand is updated to null so the navbar falls back to initials
export const useRemoveAvatar = () => {
  return useMutation({
    mutationFn: async () => {
      // Simple DELETE — no body needed, user is identified by their auth cookie
      const response = await api.delete("/auth/avatar");
      return response.data as { message: string };
    },
    onSuccess: () => {
      // Clear avatar from Zustand — navbar and edit page both re-render to initials
      useAuthStore.getState().updateUser({ avatar: undefined });
    },
  });
};
