// Import React hooks
import { useState } from "react";

// Import React Query for data fetching and deletion mutation
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import our Axios instance
import api from "../../lib/api";

// Import icons
import { Star, Trash2, ShieldCheck } from "lucide-react";

// Import useDebouncedValue for the search input
import { useDebouncedValue } from "@mantine/hooks";
import { toast } from "sonner";

import type { IReview } from "../../types/book";

export default function AdminReviews() {
  const queryClient = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);

  // Filter by minimum star rating — empty string means show all
  const [minRating, setMinRating] = useState("");

  // Search by book title — raw value
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 400);

  // Fetch all reviews across all books — admin view
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews", page, minRating, debouncedSearch],
    queryFn: async () => {
      // Build query params for the admin reviews endpoint
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (minRating) params.set("minRating", minRating);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const { data } = await api.get(`/admin/reviews?${params}`);
      return data; // { reviews, total, totalPages, currentPage }
    },
  });

  // Mutation to delete a review — admin can delete any review
  const { mutate: deleteReview } = useMutation({
    mutationFn: async (reviewId: string) => {
      // DELETE /api/reviews/:reviewId — same endpoint, admin role check is on the server
      const { data } = await api.delete(`/reviews/${reviewId}`);
      return data;
    },
    onSuccess: () => {
      // Refresh the admin reviews list after deletion
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Review deleted successfully");
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Failed to delete review",
      );
    },
  });

  const handleDelete = (reviewId: string) => {
    if (window.confirm("Delete this review? This action cannot be undone.")) {
      deleteReview(reviewId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Reviews</h1>
        <p className="text-slate-400 text-sm mt-1">
          {data?.total ?? 0} total reviews across all books.
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        {/* Search by book title or reviewer name */}
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field max-w-xs"
          placeholder="Search by book title..."
        />

        {/* Filter by star rating */}
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
          className="bg-[#1E293B] border border-slate-700 text-slate-300 text-sm 
            rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
        >
          <option value="">All Ratings</option>
          <option value="1">1★ and above</option>
          <option value="2">2★ and above</option>
          <option value="3">3★ and above</option>
          <option value="4">4★ and above</option>
          <option value="5">5★ only</option>
        </select>
      </div>

      {/* Reviews table */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Loading reviews...
          </div>
        ) : data?.reviews?.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No reviews found.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {data?.reviews?.map((review: IReview) => (
              <div
                key={review._id}
                className="p-6 hover:bg-slate-700/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side — reviewer info + review content */}
                  <div className="flex-1 space-y-2">
                    {/* Reviewer + book name + date */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Reviewer avatar */}
                      <div
                        className="w-8 h-8 rounded-full bg-slate-700
                                      flex items-center justify-center text-xs font-bold text-slate-300"
                      >
                        {review.userId?.firstName?.[0]}
                        {review.userId?.lastName?.[0]}
                      </div>

                      <div>
                        <span className="text-white text-sm font-medium">
                          {review.userId?.firstName} {review.userId?.lastName}
                        </span>
                        <span className="text-slate-500 text-sm">
                          {" "}
                          reviewed{" "}
                        </span>
                        <span className="text-teal-400 text-sm font-medium">
                          {review.bookId?.title ?? "Unknown Book"}
                        </span>
                      </div>

                      {/* Verified purchase badge */}
                      {review.isPurchaseVerified && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                          <ShieldCheck size={11} />
                          Verified
                        </div>
                      )}

                      {/* Date */}
                      <span className="text-slate-500 text-xs ml-auto">
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>

                    {/* Star rating */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < review.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-600"
                          }
                        />
                      ))}
                    </div>

                    {/* Review comment */}
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                      {review.comment}
                    </p>

                    {/* Helpful count */}
                    <p className="text-slate-600 text-xs">
                      {review.helpfulCount} people found this helpful
                    </p>
                  </div>

                  {/* Right side — delete button */}
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="p-2 text-slate-500 hover:text-red-400
                               hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                    title="Delete review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Page {data.currentPage} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg
                           hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg
                           hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
