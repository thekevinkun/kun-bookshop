import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBook, useSimilarBooks } from "../../hooks/useBooks";
import { useAuthStore } from "../../store/auth";
import SEO from "../../components/common/SEO";
import { BookJsonLd } from "../../components/common/JsonLd";
import {
  BookDetailHero,
  BookDetailVideo,
  BookDetailTabs,
  SimilarBooks,
} from "../../components/features";
import { addRecentlyViewed } from "../../lib/recentlyViewed";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Fetch the book from the real API — no placeholder fallback
  const { data: book, isLoading, isError } = useBook(id!);

  // Fetch related books using shared meaningful categories from the server.
  const { data: relatedBooks = [] } = useSimilarBooks(id!);

  // Write this book to recently viewed as soon as it loads successfully
  // We do this here — not in BookCard — because the user has actually opened the detail page
  // which is a stronger signal of interest than just scrolling past a card
  useEffect(() => {
    if (book) addRecentlyViewed(book); // only fires when book data is ready
  }, [book?._id]); // re-runs only if the book ID changes, not on every re-render

  // LOADING
  if (isLoading) {
    return (
      <main className="min-h-screen bg-navy">
        <div className="container-page py-16 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center min-h-[85vh]">
            <div className="flex flex-col gap-4">
              <div className="skeleton h-16 w-3/4 rounded" />
              <div className="skeleton h-6 w-1/3 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
            <div className="skeleton aspect-[2/3] w-64 mx-auto rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  // NOT FOUND
  // Show this when the API returns an error or the book simply doesn't exist
  if (isError || !book) {
    return (
      <main className="container-page text-center py-24">
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
      </main>
    );
  }

  return (
    <>
      <SEO
        title={book.title}
        description={
          book.description
            ? book.description.slice(0, 155) // Google shows ~155 chars in search results
            : `Buy "${book.title}" by ${book.authorName} on Kun Bookshop.`
        }
        image={book.coverImage} // Cloudinary URL — already absolute, SEO component handles it
        url={`/books/${book._id}`}
        type="book"
        author={book.authorName}
      />
      <BookJsonLd
        id={book._id}
        title={book.title}
        description={book.description ?? `A book by ${book.authorName}`}
        image={book.coverImage}
        authorName={book.authorName} // always authorName — never book.author
        price={book.discountPrice ?? book.price}
        rating={book.rating}
        ratingCount={book.reviewCount}
        publishedDate={book.publishedDate}
      />
      <main className="min-h-screen">
        {/* Hero — cover image, title, price, buy button */}
        <BookDetailHero book={book} isAuthenticated={isAuthenticated} />

        {/* Main content area */}
        <section className="section bg-bg-dark">
          <div className="container-page">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left: video + tabs — takes up 2/3 of the width on desktop */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Only render the video section if this book has a video URL */}
                {book.videoUrl && (
                  <BookDetailVideo
                    posterUrl={book.coverImage}
                    videoUrl={book.videoUrl}
                  />
                )}
                <BookDetailTabs book={book} />
              </div>

              {/* Right: similar books — takes up 1/3 of the width on desktop */}
              <SimilarBooks books={relatedBooks} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
