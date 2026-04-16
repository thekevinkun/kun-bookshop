import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { bookKeys } from "./useBooks"; // Import bookKeys so we use the exact same key structure

const reviewKeys = {
  all: (bookId: string) => ["reviews", bookId] as const,
  paged: (bookId: string, page: number, sortBy: string) =>
    ["reviews", bookId, page, sortBy] as const,
};

export const useBookReviews = (
  bookId: string,
  page = 1,
  sortBy = "createdAt",
) => {
  return useQuery({
    queryKey: reviewKeys.paged(bookId, page, sortBy),
    queryFn: async () => {
      const { data } = await api.get(
        `/reviews/${bookId}?page=${page}&limit=5&sortBy=${sortBy}`,
      );
      return data; // Now includes avgRating
    },
    staleTime: 60 * 1000,
    enabled: !!bookId,
  });
};

export const useCreateReview = (bookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { rating: number; comment: string }) => {
      const { data } = await api.post(`/reviews/${bookId}`, payload);
      return data;
    },
    onSuccess: () => {
      // Invalidate all review pages for this book — new review appears in the list
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(bookId) });
      // Also invalidate the book detail query so book.rating and reviewCount update
      // Without this the tab label "Reviews (N)" and the hero rating stay stale
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
};

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
      const { data } = await api.put(`/reviews/${reviewId}`, {
        rating,
        comment,
      });
      return data;
    },
    onSuccess: () => {
      // Same dual invalidation — rating changed so both caches are stale
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
};

export const useDeleteReview = (bookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data } = await api.delete(`/reviews/${reviewId}`);
      return data;
    },
    onSuccess: () => {
      // Deleted review changes the count and average — invalidate both
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
};

export const useMarkHelpful = (bookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data } = await api.post(`/reviews/${reviewId}/helpful`);
      return data;
    },
    onSuccess: () => {
      // Helpful votes don't affect rating — no need to invalidate the book query
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(bookId) });
    },
  });
};
