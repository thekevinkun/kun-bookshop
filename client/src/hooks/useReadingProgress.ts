import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import api from "../lib/api";

import type { ReadingProgressData } from "../types/book";

// Fetches saved position for a book — called when reader opens
export const useReadingProgress = (bookId: string | null) => {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["readingProgress", bookId],
    queryFn: async () => {
      const { data } = await api.get(`/reading-progress/${bookId}`);
      return data.progress as ReadingProgressData | null;
    },
    enabled: isHydrated && isAuthenticated && !!bookId,
    staleTime: 30 * 1000,
    retry: false,
  });
};

// Simple save mutation — called explicitly by BookPreview on page change
// No debounce logic here — BookPreview handles the timing
export const useSaveProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      currentPage,
      totalPages,
    }: {
      bookId: string;
      currentPage: number;
      totalPages: number;
    }) => {
      await api.put(`/reading-progress/${bookId}`, {
        currentPage,
        totalPages,
      });

      return {
        bookId,
        currentPage,
        totalPages,
        lastReadAt: new Date().toISOString(),
      } satisfies ReadingProgressData & { bookId: string };
    },
    onSuccess: ({ bookId, currentPage, totalPages, lastReadAt }) => {
      queryClient.setQueryData<ReadingProgressData | null>(
        ["readingProgress", bookId],
        {
          currentPage,
          totalPages,
          lastReadAt,
        },
      );
    },
    // Silent — no toast, no UI side effects
  });
};
