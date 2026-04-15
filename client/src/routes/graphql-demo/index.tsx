// graphql-demo/index.tsx — /graphql-demo
// A portfolio showcase page that demonstrates GraphQL queries running against
// the Apollo Server endpoint. Uses plain fetch — no Apollo Client — to show
// that GraphQL is just HTTP with a JSON body.
import { useState } from "react";
import { useBooks } from "../../hooks/useBooks"; // Reuse existing hook for the book picker
import { useAuthStore } from "../../store/auth"; // Read JWT token for authenticated mutations
import {
  Star,
  Loader2,
  Code2,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

type Book = {
  _id: string;
  title: string;
  authorName: string;
};

type Review = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  isPurchaseVerified: boolean;
  helpfulCount: number;
  createdAt: string;
};

type BookReviewsResult = {
  totalCount: number;
  avgRating: number;
  reviews: Review[];
};

type CreateReviewResult = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  isPurchaseVerified: boolean;
  createdAt: string;
};

// Import the base URL from your environment variable — same one the Axios instance uses
// This ensures GraphQL fetch goes to localhost:5000 in dev and your real domain in production
const API_BASE =
  import.meta.env.VITE_SERVER_BASE_URL ?? "http://localhost:5000"; // Vite exposes env vars via import.meta.env

// GraphQL fetch helper
// Sends a GraphQL query or mutation to our Apollo Server endpoint.
// GraphQL always uses POST — the query string goes in the request body as JSON.
const gqlFetch = async (
  query: string,
  variables: Record<string, unknown> = {},
  token?: string,
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json", // GraphQL requires JSON content type
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`; // Attach JWT for authenticated operations
  }

  const response = await fetch(`${API_BASE}/graphql`, {
    // Our Apollo Server endpoint
    method: "POST", // GraphQL always uses POST
    headers,
    body: JSON.stringify({ query, variables }), // Query + variables go in the body
  });

  const json = await response.json(); // Parse the JSON response

  // GraphQL errors come back as HTTP 200 with an "errors" array — not HTTP error codes
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? "GraphQL error"); // Surface the first error
  }

  return json.data; // The actual query result lives in data
};

// Star rating display
// Simple component that renders filled/empty stars for a given rating (1–5)
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-3.5 h-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-[var(--color-border)]"}`}
      />
    ))}
  </div>
);

// Query display panel
// Shows the raw GraphQL query string with syntax-like styling — useful for recruiter demo
const QueryPanel = ({ query }: { query: string }) => (
  <pre className="text-xs font-mono bg-slate-900 text-slate-300 rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">
    {query.trim()} {/* Trim leading newline from template literal */}
  </pre>
);

export default function GraphQLDemoPage() {
  // Book picker state
  const { data: booksData } = useBooks({}); // Fetch available books for the dropdown
  const books = booksData?.books ?? []; // Default to empty while loading
  const [selectedBookId, setSelectedBookId] = useState(""); // Which book to query reviews for

  // Reviews query state
  const [reviewsResult, setReviewsResult] = useState<BookReviewsResult | null>(
    null,
  ); // Query result
  const [reviewsLoading, setReviewsLoading] = useState(false); // Loading flag
  const [reviewsError, setReviewsError] = useState(""); // Error message

  // Create review mutation state
  const { token } = useAuthStore(); // JWT for authenticated mutations
  const [mutRating, setMutRating] = useState(5); // Rating picker (1–5)
  const [mutComment, setMutComment] = useState(""); // Comment text
  const [mutResult, setMutResult] = useState<CreateReviewResult | null>(null); // Mutation result
  const [mutLoading, setMutLoading] = useState(false);
  const [mutError, setMutError] = useState("");

  // The actual GraphQL query strings
  // Defined as constants so we can display them in the UI — shows recruiters the query syntax
  const BOOK_REVIEWS_QUERY = `
    query GetBookReviews($bookId: ID!, $page: Int, $limit: Int, $sortBy: String) {
      bookReviews(bookId: $bookId, page: $page, limit: $limit, sortBy: $sortBy) {
        totalCount
        avgRating
        reviews {
          id
          authorName
          rating
          comment
          isPurchaseVerified
          helpfulCount
          createdAt
        }
      }
    }
  `;

  //   const TOP_REVIEWS_QUERY = `
  //     query GetTopReviews($bookId: ID!) {
  //       topReviews(bookId: $bookId) {
  //         id
  //         authorName
  //         rating
  //         comment
  //         isPurchaseVerified
  //         helpfulCount
  //       }
  //     }
  //   `;

  const CREATE_REVIEW_MUTATION = `
    mutation CreateReview($bookId: ID!, $rating: Int!, $comment: String!) {
      createReview(bookId: $bookId, rating: $rating, comment: $comment) {
        id
        authorName
        rating
        comment
        isPurchaseVerified
        createdAt
      }
    }
  `;

  // Handlers
  // Run the bookReviews query with the selected book
  const runReviewsQuery = async () => {
    if (!selectedBookId) return; // Guard — do nothing if no book selected
    setReviewsLoading(true); // Show loading state
    setReviewsError(""); // Clear previous error
    setReviewsResult(null); // Clear previous result

    try {
      const data = await gqlFetch(BOOK_REVIEWS_QUERY, {
        bookId: selectedBookId, // Pass as a variable — not string interpolated into the query
        page: 1,
        limit: 5,
        sortBy: "helpful",
      });
      setReviewsResult(data.bookReviews); // Store the result for display
    } catch (err) {
      if (err instanceof Error) {
        setReviewsError(err.message);
      } else {
        setReviewsError("Unknown error");
      }
    } finally {
      setReviewsLoading(false);
    }
  };

  // Run the createReview mutation
  const runCreateMutation = async () => {
    if (!selectedBookId || !mutComment.trim()) return;
    setMutLoading(true);
    setMutError("");
    setMutResult(null);

    try {
      const data = await gqlFetch(
        CREATE_REVIEW_MUTATION,
        { bookId: selectedBookId, rating: mutRating, comment: mutComment },
        token ?? undefined, // Attach JWT so the resolver knows who's writing the review
      );
      setMutResult(data.createReview); // Store the created review
      setMutComment(""); // Clear the comment field after success
    } catch (err) {
      if (err instanceof Error) {
        setMutError(err.message);
      } else {
        setMutError("Unknown error");
      }
    } finally {
      setMutLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-10">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-golden-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-golden-500" />{" "}
            {/* GraphQL lightning bolt vibe */}
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            GraphQL Showcase
          </h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] max-w-xl">
          This page demonstrates the GraphQL API layer running alongside the
          REST API. Queries and mutations are sent to{" "}
          <code className="font-mono text-golden-400">/graphql</code> via plain{" "}
          <code className="font-mono text-golden-400">fetch</code> — no Apollo
          Client required.
        </p>
      </div>

      {/* Book selector — shared by both panels */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
          Select a book to query
        </label>
        <select
          value={selectedBookId}
          onChange={(e) => {
            setSelectedBookId(e.target.value); // Update selected book
            setReviewsResult(null); // Clear stale results when book changes
            setMutResult(null);
          }}
          className="w-full max-w-sm px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] 
            text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-golden-500/50"
        >
          <option value="" className="text-[var(--color-text-dark)]">
            Choose a book
          </option>
          {books.map((book: Book) => (
            <option
              className="text-[var(--color-text-dark)]"
              key={book._id}
              value={book._id}
            >
              {book.title} — {book.authorName}{" "}
              {/* Show title + author in the dropdown */}
            </option>
          ))}
        </select>
      </div>

      {/* Panel 1: bookReviews query */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-golden-500" />
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Query:{" "}
            <code className="font-mono text-golden-400 text-sm">bookReviews</code>
          </h2>
        </div>

        {/* The raw query string — visible to recruiters */}
        <QueryPanel query={BOOK_REVIEWS_QUERY} />

        <button
          onClick={runReviewsQuery}
          disabled={!selectedBookId || reviewsLoading} // Disable if no book selected or loading
          className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-golden-500 hover:bg-golden-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {reviewsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Run Query
        </button>

        {/* Error */}
        {reviewsError && (
          <div className="flex items-center gap-2 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {reviewsError}
          </div>
        )}

        {/* Results */}
        {reviewsResult && (
          <div className="flex flex-col gap-3">
            {/* Summary row */}
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
              <span>
                {reviewsResult.totalCount} review
                {reviewsResult.totalCount !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <StarRating rating={Math.round(reviewsResult.avgRating)} />
                <span>{reviewsResult.avgRating.toFixed(1)} avg</span>
              </div>
            </div>

            {/* Review cards */}
            {reviewsResult.reviews.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No reviews for this book yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {reviewsResult.reviews.map((review: Review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {review.authorName}
                        </span>
                        {review.isPurchaseVerified && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {review.comment}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      <span>
                        {format(new Date(review.createdAt), "dd MMM yyyy")}
                      </span>
                      {review.helpfulCount > 0 && (
                        <span>{review.helpfulCount} found helpful</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)]" />

      {/* Panel 2: createReview mutation */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-golden-500" />
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Mutation:{" "}
            <code className="font-mono text-golden-400 text-sm">
              createReview
            </code>
          </h2>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Requires authentication. JWT is read from the Zustand auth store and
          sent as{" "}
          <code className="font-mono text-golden-400">
            Authorization: Bearer TOKEN
          </code>
          .
        </p>

        {/* The raw mutation string */}
        <QueryPanel query={CREATE_REVIEW_MUTATION} />

        {/* Mutation inputs */}
        <div className="flex flex-col gap-3 max-w-md">
          {/* Star rating picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setMutRating(star)} // Set rating on click
                  className="p-0.5"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= mutRating
                        ? "fill-amber-400 text-amber-400" // Filled star
                        : "text-[var(--color-border)] hover:text-amber-300" // Empty star
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              Comment
            </label>
            <textarea
              value={mutComment}
              onChange={(e) => setMutComment(e.target.value)} // Controlled input
              rows={3}
              placeholder="Min. 10 characters…"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-golden-500/50 resize-none"
            />
          </div>
        </div>

        <button
          onClick={runCreateMutation}
          disabled={
            !selectedBookId || !mutComment.trim() || mutLoading || !token
          }
          className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-golden-500 hover:bg-golden-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {mutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Run Mutation
        </button>

        {/* Not logged in warning */}
        {!token && (
          <p className="text-xs text-amber-400">
            Log in to run authenticated mutations.
          </p>
        )}

        {/* Mutation error */}
        {mutError && (
          <div className="flex items-center gap-2 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {mutError}
          </div>
        )}

        {/* Mutation result */}
        {mutResult && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Review created via GraphQL mutation
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {mutResult.authorName}
                </span>
                <StarRating rating={mutResult.rating} />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {mutResult.comment}
              </p>
              {mutResult.isPurchaseVerified && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 w-fit">
                  <CheckCircle className="w-3 h-3" />
                  Purchase verified
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
