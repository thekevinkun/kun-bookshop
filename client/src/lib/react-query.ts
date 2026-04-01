// Import QueryClient — the central cache that React Query uses to store server data
import { QueryClient } from "@tanstack/react-query";

// Create and export a single QueryClient instance
// We configure it here once so every part of the app uses the same cache settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh before React Query refetches in the background
      // 5 minutes: good balance — not too stale, not too many network requests
      staleTime: 5 * 60 * 1000, // 5 minutes in milliseconds

      // How long inactive query data stays in the cache before being garbage collected
      // 10 minutes: if user navigates away and comes back, data is still there
      gcTime: 10 * 60 * 1000, // 10 minutes (was called cacheTime in v4)

      // How many times to retry a failed request before showing an error
      // 1 retry is enough — if it fails twice something is probably actually wrong
      retry: 1,

      // Don't refetch when the user switches back to the browser tab
      // Our data doesn't change that frequently — avoids unnecessary requests
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Don't retry failed mutations (POST, PUT, DELETE)
      // If a mutation fails, we want to know immediately — retrying could cause duplicates
      retry: 0,
    },
  },
});
