import { useParams, useNavigate } from "react-router-dom";
import { useBook, useBooksByCategory } from "../../hooks/useBooks";
import { useAuthStore } from "../../store/auth";

import {
  BookDetailHero,
  BookDetailVideo,
  BookDetailTabs,
  SimilarBooks,
} from "../../components/features";

import { ALL_PLACEHOLDERS } from "../../lib/data";

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Try the real API first
  const { data: apiBook, isLoading, isError } = useBook(id!);

  // Fall back to placeholder if API has no book with this ID yet
  const book = apiBook ?? ALL_PLACEHOLDERS.find((b) => b._id === id);

  // Fetch related books from same category
  const { data: apiRelated = [] } = useBooksByCategory(
    book?.category?.[0] ?? "",
  );

  // Fall back to placeholder related books if API returns nothing
  const relatedBooks =
    apiRelated.length > 0
      ? apiRelated.filter((b) => b._id !== id).slice(0, 4)
      : ALL_PLACEHOLDERS.filter(
          (b) => b._id !== id && b.category[0] === book?.category?.[0],
        ).slice(0, 4);

  // --- LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy">
        <div className="container-page py-16 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center min-h-[70vh]">
            <div className="flex flex-col gap-4">
              <div className="skeleton h-16 w-3/4 rounded" />
              <div className="skeleton h-6 w-1/3 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
            <div className="skeleton aspect-[2/3] w-64 mx-auto rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // --- NOT FOUND ---
  // Only show error when both API AND placeholder have nothing
  if ((isError || !apiBook) && !book) {
    return (
      <div className="container-page text-center py-24">
        <p className="text-6xl mb-4">📖</p>
        <h2 className="text-text-light text-2xl font-bold mb-2">
          Book not found
        </h2>
        <p className="text-text-muted mb-6">
          This book may have been removed or the link is incorrect.
        </p>
        <button className="btn-primary" onClick={() => navigate("/books")}>
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero — cover + info + buy button */}
      <BookDetailHero book={book!} isAuthenticated={isAuthenticated} />

      {/* Content — video + tabs on left, similar books on right */}
      <section className="section bg-bg-dark">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: 2/3 width */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <BookDetailVideo
                posterUrl={book!.coverImage}
                videoUrl={book!.videoUrl}
              />
              <BookDetailTabs book={book!} />
            </div>

            {/* Right: 1/3 width */}
            <SimilarBooks books={relatedBooks} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookDetailPage;
