// Import React hooks for state management
import { useState } from "react";

// Import navigation icons for pagination
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import the books fetching hook
import { useBooks } from "../../hooks/useBooks";

// Import the feature components
import { BookGrid, BookFiltersComponent } from "../../components/features";

// Import the BookFilters type
import type { BookFilters } from "../../types/book";

export default function BooksPage() {
  // All active filters live here as controlled state
  const [filters, setFilters] = useState<BookFilters>({
    page: 1,
    limit: 15,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch books from the real API with the current filters
  const { data, isLoading } = useBooks(filters);

  const books = data?.books ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? 1;
  const totalCount = data?.total ?? 0;

  // Scroll to top and change page
  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero search section */}
      <section className="relative bg-navy pt-12 overflow-visible">
        {/* Background teal glow — decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
            bg-teal/5 rounded-full blur-3xl"
          />
        </div>

        <div className="container-page relative z-10 text-center">
          <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-3">
            Discover Your Next Great Read
          </p>
          <h1 className="text-text-light leading-tight mb-2">
            Explore and Search for
          </h1>
          <h1 className="leading-tight mb-10">
            <span className="text-teal">Any Book</span>
            <span className="text-text-light"> In Our Library</span>
          </h1>

          {/* BookFiltersComponent always visible — search + sort + filters */}
          <div className="max-w-3xl mx-auto">
            <BookFiltersComponent filters={filters} onChange={setFilters} />
          </div>
        </div>
      </section>

      {/* Catalog section */}
      <section className="section bg-bg-dark">
        <div className="container-page">
          {/* Section heading */}
          <div className="mb-8">
            <h2 className="text-text-light uppercase tracking-wider">
              All Library Books
            </h2>

            <div className="w-10 h-1 bg-teal rounded-full mt-1" />

            {!isLoading && (
              <p className="text-text-muted text-xs mt-2">
                {totalCount.toLocaleString()}{" "}
                {totalCount === 1 ? "book" : "books"} found
              </p>
            )}
          </div>

          {/* Loading state — skeleton grid */}
          {isLoading && (
            <BookGrid books={[]} isLoading={true} skeletonCount={15} />
          )}

          {/* Empty state — no books in DB at all */}
          {!isLoading &&
            books.length === 0 &&
            !filters.search &&
            !filters.category &&
            !filters.minPrice &&
            !filters.maxPrice &&
            !filters.fileType && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-5xl mb-4">📚</p>
                <h3 className="text-text-light mb-2">No books yet</h3>
                <p className="text-text-muted text-sm">
                  The catalog is empty — check back soon.
                </p>
              </div>
            )}

          {/* No results state — filters are active but nothing matched */}
          {!isLoading &&
            books.length === 0 &&
            (filters.search ||
              filters.category ||
              filters.minPrice ||
              filters.maxPrice ||
              filters.fileType) && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-5xl mb-4">🔍</p>

                <h3 className="text-text-light mb-2">No results found</h3>

                <p className="text-text-muted text-sm mb-4">
                  Try adjusting your filters or searching for something else.
                </p>

                <button
                  className="btn-ghost btn-sm"
                  onClick={() =>
                    setFilters({
                      page: 1,
                      limit: 15,
                      sortBy: "createdAt",
                      sortOrder: "desc",
                    })
                  }
                >
                  Clear all filters
                </button>
              </div>
            )}

          {/* Book grid — only when we have results */}
          {!isLoading && books.length > 0 && (
            <BookGrid books={books} isLoading={false} skeletonCount={15} />
          )}

          {/* Pagination — only when there's more than one page */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                className="btn-ghost btn-sm flex items-center gap-1"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              {/* Page number buttons with ellipsis for large ranges */}
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
}
