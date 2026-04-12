// Import React Query hooks for data fetching and mutations
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import our configured Axios instance
import api from "../lib/api";

// Query key constants
const AUTHORS_KEY = ["authors"] as const;

// useAuthors
// Fetches all active authors — used by both the admin table and the book form dropdown
export const useAuthors = (page = 1, search = "") => {
  return useQuery({
    queryKey: [...AUTHORS_KEY, page, search],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);

      const { data } = await api.get(`/authors?${params}`);
      return data; // { authors, total, totalPages, currentPage }
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
};

// useAllAuthors
// Fetches ALL authors with no pagination — used by the book form dropdown
// We request a high limit so the dropdown has the full list
export const useAllAuthors = () => {
  return useQuery({
    queryKey: [...AUTHORS_KEY, "all"],
    queryFn: async () => {
      const { data } = await api.get("/authors");
      return data.authors; // Returns a flat array, not paginated
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — author list doesn't change often
  });
};

// useCreateAuthor
// Mutation to create a new author with FormData (includes avatar file)
export const useCreateAuthor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      // POST /api/authors — multipart because of the avatar file
      const { data } = await api.post("/authors", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate all author cache entries so the table and dropdown refresh
      queryClient.invalidateQueries({ queryKey: AUTHORS_KEY });
    },
  });
};

// useUpdateAuthor
// Mutation to update an existing author
export const useUpdateAuthor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      authorId,
      formData,
    }: {
      authorId: string;
      formData: FormData;
    }) => {
      // PUT /api/authors/:id — multipart because avatar might be included
      const { data } = await api.put(`/authors/${authorId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTHORS_KEY });
    },
  });
};

// useDeleteAuthor
// Mutation to soft-delete an author
export const useDeleteAuthor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (authorId: string) => {
      // DELETE /api/authors/:id
      const { data } = await api.delete(`/authors/${authorId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTHORS_KEY });
    },
  });
};
