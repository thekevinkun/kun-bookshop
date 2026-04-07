// Import React Query hooks for data fetching and mutations
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import our configured Axios instance
import api from "../lib/api";

// Query Key factory
// Centralized so invalidation always hits the right cache entries
const reviewKeys = {
  all: (bookId: string) => ["reviews", bookId] as const,
  paged: (bookId: string, page: number, sortBy: string) =>
    ["reviews", bookId, page, sortBy] as const,
};

// useBookReviews
// Fetches paginated reviews for a single book
export const useBookReviews = (
  bookId: string,
  page = 1,
  sortBy = "createdAt",
) => {
  return useQuery({
    queryKey: reviewKeys.paged(bookId, page, sortBy),
    queryFn: async () => {
      // GET /api/reviews/:bookId with pagination and sort params
      const { data } = await api.get(
        `/reviews/${bookId}?page=${page}&limit=5&sortBy=${sortBy}`,
      );
      return data; // { reviews, total, totalPages, currentPage }
    },
    staleTime: 60 * 1000, // Cache for 1 minute
    enabled: !!bookId, // Don't fetch if bookId is empty
  });
};

// useCreateReview
// Mutation to submit a new review
export const useCreateReview = (bookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { rating: number; comment: string }) => {
      // POST /api/reviews/:bookId
      const { data } = await api.post(`/reviews/${bookId}`, payload);
      return data;
    },
    onSuccess: () => {
      // Invalidate all review pages for this book so the new review appears
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(bookId) });
    },
  });
};

// useUpdateReview
// Mutation to edit an existing review
export const useUpdateReview = (bookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      rating,
      comment,
    }: {
      reviewId: string;
      rating: number;
      comment: string;
    }) => {
      // PUT /api/reviews/:reviewId
      const { data } = await api.put(`/reviews/${reviewId}`, {
        rating,
        comment,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(bookId) });
    },
  });
};

// useDeleteReview
// Mutation to delete a review
export const useDeleteReview = (bookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      // DELETE /api/reviews/:reviewId
      const { data } = await api.delete(`/reviews/${reviewId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(bookId) });
    },
  });
};

// useMarkHelpful
// Mutation to toggle a helpful vote on a review
export const useMarkHelpful = (bookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      // POST /api/reviews/:reviewId/helpful
      const { data } = await api.post(`/reviews/${reviewId}/helpful`);
      return data; // { helpfulCount, voted }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(bookId) });
    },
  });
};
