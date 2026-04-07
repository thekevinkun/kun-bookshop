import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBooks } from "../../hooks/useBooks";

import { BookGrid, BookFiltersComponent } from "../../components/features";

import type { BookFilters } from "../../types/book";

const BooksPage = () => {
  // All active filters live here — same as the original design
  const [filters, setFilters] = useState<BookFilters>({
    page: 1,
    limit: 15,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch books with the current filters
  const { data, isLoading } = useBooks(filters);

  // Use real data if available, placeholders otherwise
  const books = data?.books && data.books.length > 0 ? data.books : null;

  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? 1;
  const totalCount = data?.total ?? 0;

  // Scroll to top + change page
  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading && !books) {
    // Show a loading state if we're fetching data for the first time
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-navy animate-pulse">
        <div className="w-48 h-6 bg-bg-hover rounded mb-4" />
        <div className="w-64 h-10 bg-bg-hover rounded mb-2" />
        <div className="w-32 h-4 bg-bg-hover rounded mb-6" />
        <div className="w-40 h-5 bg-bg-hover rounded" />
      </section>
    );
  }

  if (!books || books.length === 0) {
    // Show an empty state if there are no books to display
    return (
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-navy">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">📚</p>
          <h3 className="text-text-light text-lg font-semibold mb-2">
            No books yet
          </h3>
          <p className="text-text-muted text-sm">
            There are no books at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen">
      {/* HERO SEARCH SECTION */}
      <section className="relative bg-navy pt-12 overflow-hidden">
        {/* Background teal glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal/5 rounded-full blur-3xl" />
        </div>

        <div className="container-page relative z-10 text-center">
          {/* Eyebrow */}
          <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-3">
            Discover Your Next Great Read
          </p>

          {/* Headline */}
          <h1 className="text-text-light text-4xl sm:text-5xl font-bold leading-tight mb-2">
            Explore and Search for
          </h1>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-10">
            <span className="text-teal">Any Book</span>
            <span className="text-text-light"> In Our Library</span>
          </h1>

          {/* ---- BookFiltersComponent sits here inside the hero ---- */}
          {/* It owns the search bar, autocomplete, sort, and filter panel */}
          <div className="max-w-3xl mx-auto">
            <BookFiltersComponent filters={filters} onChange={setFilters} />
          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <section className="section bg-bg-dark">
        <div className="container-page">
          {/* Section heading */}
          <div className="mb-8">
            <h2 className="text-text-light text-xl font-bold uppercase tracking-wider">
              All Library Books
            </h2>
            <div className="w-10 h-1 bg-teal rounded-full mt-1" />
            <p className="text-text-muted text-xs mt-2">
              {totalCount.toLocaleString()} books available
            </p>
          </div>

          {/* Book grid */}
          <BookGrid books={books} isLoading={isLoading} skeletonCount={15} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                className="btn-ghost btn-sm flex items-center gap-1"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1,
                )
                .reduce<(number | string)[]>((acc, page, idx, arr) => {
                  if (
                    idx > 0 &&
                    (page as number) - (arr[idx - 1] as number) > 1
                  ) {
                    acc.push("...");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((page, idx) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="text-text-muted px-2"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
                        ${
                          currentPage === page
                            ? "bg-teal text-white"
                            : "btn-ghost text-text-muted"
                        }`}
                      onClick={() => goToPage(page as number)}
                    >
                      {page}
                    </button>
                  ),
                )}

              <button
                className="btn-ghost btn-sm flex items-center gap-1"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BooksPage;
