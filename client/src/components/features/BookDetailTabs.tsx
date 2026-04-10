// Import React hooks for state management
import { useState } from "react";

// Import Radix Tabs for the accessible tab UI
import * as RadixTabs from "@radix-ui/react-tabs";

// Import icons
import {
  Star,
  FileText,
  Download,
  BookOpen,
  Calendar,
  Tag,
  Building2,
} from "lucide-react";

// Import React Router for navigation
import { useNavigate } from "react-router-dom";

// Import auth store — we need to know who is logged in to show the review form
import { useAuthStore } from "../../store/auth";

// Import the library hook from Phase 5 — to check if the user owns this book
import { useLibrary } from "../../hooks/useLibrary";

import { ReviewForm } from "../forms";
import { AuthorTabInfo, ReviewCard } from "../../cards";

// Import all our review hooks
import { useBookReviews } from "../../hooks/useReviews";

// Import our book and review type
import type { IBook, IReview } from "../../types/book";

// Import helper functions
import {
  formatFileSize,
  formatDate,
  resolveAuthorName,
} from "../../lib/helpers";

interface BookDetailTabsProps {
  book: IBook;
}

// Main BookDetailTabs component
const BookDetailTabs = ({ book }: BookDetailTabsProps) => {
  const navigate = useNavigate();
  const authorName = resolveAuthorName(book.author);

  // Get the logged-in user from the auth store
  const { user, isAuthenticated } = useAuthStore();

  // Pagination + sort state for the reviews tab
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewSortBy, setReviewSortBy] = useState("createdAt");

  // Fetch real reviews from the backend
  const { data: reviewsData, isLoading: reviewsLoading } = useBookReviews(
    book._id,
    reviewPage,
    reviewSortBy,
  );

  // Fetch the user's library so we can check if they own this book
  // useLibrary returns the list of purchased books — same hook from Phase 5
  const { data: libraryData } = useLibrary();

  // Does the logged-in user own this book?
  const ownsBook =
    libraryData?.library?.some(
      (b: { _id?: string }) => b._id?.toString() === book._id?.toString(),
    ) ?? false;

  // Has the logged-in user already reviewed this book?
  const userReview = reviewsData?.reviews?.find(
    (r: { userId?: { _id?: string } }) => r.userId?._id === user?.id,
  );

  const hasReviewed = !!userReview;

  const bookMoreDetails = [
    {
      icon: <FileText size={14} className="text-teal-400" />,
      label: "Format",
      value: book.fileType.toUpperCase(),
    },
    {
      icon: <Download size={14} className="text-teal-400" />,
      label: "File Size",
      value: formatFileSize(book.fileSize),
    },
    {
      icon: <BookOpen size={14} className="text-teal-400" />,
      label: "Category",
      value: book.category[0],
    },
    {
      icon: <Calendar size={14} className="text-teal-400" />,
      label: "Published",
      value: formatDate(book.publishedDate) ?? "N/A",
    },
    {
      icon: <Tag size={14} className="text-teal-400" />,
      label: "ISBN",
      value: book.isbn ?? "N/A",
    },
    {
      icon: <Building2 size={14} className="text-teal-400" />,
      label: "Publisher",
      value: book.publisher ?? "N/A",
    },
    {
      icon: <Star size={14} className="text-teal-400" />,
      label: "Purchases",
      value: book.purchaseCount.toLocaleString(),
    },
    {
      icon: <BookOpen size={14} className="text-teal-400" />,
      label: "Preview",
      // Only show the page count if previewPages exists, otherwise show N/A
      value: book.previewPages ? `${book.previewPages} pages` : "N/A",
    },
  ];

  return (
    <RadixTabs.Root defaultValue="summary" className="flex flex-col gap-0">
      {/* Tab header */}
      <RadixTabs.List
        className="flex border-b border-slate-700/50 mb-6"
        aria-label="Book details"
      >
        {[
          { value: "summary", label: "Summary" },
          { value: "reviews", label: `Reviews (${book.reviewCount ?? 0})` },
          { value: "author", label: "Author Info" },
        ].map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className="relative px-5 py-3 text-sm font-semibold transition-all duration-200
              text-slate-500 hover:text-slate-200 data-[state=active]:text-teal-400
              focus:outline-none"
          >
            {tab.label}
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-teal-400
                scale-x-0 transition-transform duration-200 [[data-state=active]_&]:scale-x-100"
            />
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {/* SUMMARY TAB */}
      <RadixTabs.Content value="summary" className="focus:outline-none">
        <div className="flex flex-col gap-4">
          <p className="text-slate-400 leading-relaxed text-sm">
            {book.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {bookMoreDetails.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 bg-[#0F172A] rounded-lg px-3 py-2"
              >
                {item.icon}
                <div>
                  <p className="text-slate-500 text-xs">{item.label}</p>
                  <p className="text-slate-200 text-xs font-semibold">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {book.tags.map((tag) => (
                <span key={tag} className="badge-primary text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </RadixTabs.Content>

      {/* REVIEWS TAB */}
      <RadixTabs.Content value="reviews" className="focus:outline-none">
        <div className="flex flex-col gap-5">
          {/* Rating summary card */}
          <div className="flex items-center gap-4 p-4 bg-[#0F172A] rounded-xl">
            <div className="text-center">
              <p className="text-teal-400 text-5xl font-black leading-none">
                {(book.rating ?? 0).toFixed(1)}
              </p>
              <div className="flex gap-0.5 justify-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < Math.round(book.rating ?? 0)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600"
                    }
                  />
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {book.reviewCount ?? 0} reviews
              </p>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs w-3">{star}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    {/* Distribution bar — real data would need a separate aggregate endpoint */}
                    {/* For now we approximate from the average rating */}
                    <div
                      className="h-full bg-teal-400 rounded-full"
                      style={{
                        width:
                          star === Math.round(book.rating ?? 0)
                            ? "60%"
                            : star > Math.round(book.rating ?? 0)
                              ? `${Math.max(5, 60 - (star - Math.round(book.rating ?? 0)) * 20)}%`
                              : `${Math.max(3, 40 - (Math.round(book.rating ?? 0) - star) * 15)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sort control */}
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              {reviewsData?.total ?? 0} reviews
            </p>
            <select
              value={reviewSortBy}
              onChange={(e) => {
                setReviewSortBy(e.target.value);
                setReviewPage(1);
              }}
              className="bg-[#1E293B] border border-slate-700 text-slate-300 text-sm
                rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500"
            >
              <option value="createdAt">Most Recent</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>

          {/* Review form — shown only when:
              1. User is logged in
              2. User owns the book
              3. User has NOT already reviewed this book */}
          {!isAuthenticated && (
            <div className="p-4 bg-[#0F172A] rounded-xl border border-slate-700/50 text-center">
              <p className="text-slate-400 text-sm">
                <button
                  onClick={() => navigate("/login")}
                  className="text-teal-400 hover:underline"
                >
                  Sign in
                </button>{" "}
                to leave a review.
              </p>
            </div>
          )}

          {isAuthenticated && !ownsBook && (
            <div className="p-4 bg-[#0F172A] rounded-xl border border-slate-700/50 text-center">
              <p className="text-slate-400 text-sm">
                Purchase this book to leave a verified review.
              </p>
            </div>
          )}

          {isAuthenticated && ownsBook && !hasReviewed && (
            // Show the create form — user owns the book and hasn't reviewed yet
            <ReviewForm bookId={book._id} />
          )}

          {isAuthenticated && ownsBook && hasReviewed && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-green-400 text-sm text-center">
                You've reviewed this book. Find your review below to edit or
                delete it.
              </p>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="text-center text-slate-500 text-sm py-8">
              Loading reviews...
            </div>
          ) : reviewsData?.reviews?.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              No reviews yet. Be the first to review this book!
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviewsData?.reviews?.map((review: { _id?: string }) => (
                <ReviewCard
                  key={review._id}
                  review={review as IReview}
                  bookId={book._id}
                  currentUserId={user?.id}
                  currentUserRole={user?.role}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {reviewsData?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setReviewPage((p) => p - 1)}
                disabled={reviewPage === 1}
                className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg
                hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-slate-500 text-sm">
                {reviewsData.currentPage} / {reviewsData.totalPages}
              </span>
              <button
                onClick={() => setReviewPage((p) => p + 1)}
                disabled={reviewPage === reviewsData.totalPages}
                className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg
                  hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </RadixTabs.Content>

      {/* AUTHOR TAB */}
      <RadixTabs.Content value="author" className="focus:outline-none">
        <div className="flex flex-col gap-5">
          <AuthorTabInfo book={book} authorName={authorName} />

          <button
            className="btn-ghost btn-sm self-start flex items-center gap-2"
            onClick={() => navigate(`/books?search=${authorName}`)}
          >
            <BookOpen size={14} />
            Browse more by {authorName.split(" ")[0]}
          </button>
        </div>
      </RadixTabs.Content>
    </RadixTabs.Root>
  );
};

export default BookDetailTabs;
