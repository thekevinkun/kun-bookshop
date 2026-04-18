// Import React hooks for state management
import { useRef, useState } from "react";

import { useSearchParams } from "react-router-dom";

import { useMediaQuery } from "react-responsive";

// Import navigation icons for pagination
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import the books fetching hook
import { useBooks } from "../../hooks/useBooks";

import SEO from "../../components/common/SEO";

import { RecentlyViewedSection } from "../../components/layout";

// Import the feature components
import { BookGrid, BookFiltersComponent } from "../../components/features";

// Import the BookFilters type
import type { BookFilters } from "../../types/book";

export default function BooksPage() {
  const [searchParams] = useSearchParams();
  const discountLabel = searchParams.get("discountLabel"); // e.g. "25% OFF"

  const catalogTopRef = useRef<HTMLDivElement | null>(null);

  const isTablet = useMediaQuery({ maxWidth: 639 });

  const totalBookToShow = isTablet ? 16 : 15;

  // Initialize filters directly from URL so the first useBooks call is already correct
  const [filters, setFilters] = useState<BookFilters>(() => {
    const urlDiscountMin = searchParams.get("discountMin");
    const urlDiscountMax = searchParams.get("discountMax");
    const urlSortBy = searchParams.get("sortBy") as BookFilters["sortBy"];
    const urlSortOrder = searchParams.get(
      "sortOrder",
    ) as BookFilters["sortOrder"];
    const urlSearch = searchParams.get("search");

    return {
      page: 1,
      limit: totalBookToShow,
      sortBy: urlSortBy || "createdAt",
      sortOrder: urlSortOrder || "desc",
      ...(urlSearch && { search: urlSearch }),
      ...(urlDiscountMin && { discountMin: Number(urlDiscountMin) }),
      ...(urlDiscountMax && { discountMax: Number(urlDiscountMax) }),
    };
  });

  // Fetch books from the real API with the current filters
  const { data, isLoading } = useBooks(filters);

  const books = data?.books ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? 1;
  const totalCount = data?.total ?? 0;

  // True when the user has applied any actual filter — sort doesn't count
  // Used to hide RecentlyViewed and relabel the catalog heading
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.category ||
    filters.categoryBucket ||
    filters.fileType ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.discountMin !== undefined ||
    filters.discountMax !== undefined,
  );

  // Blur the clicked pagination button so the browser does not snap it back into view.
  // Then scroll the catalog heading into view with space for the sticky navbar.
  const goToPage = (page: number) => {
    (document.activeElement as HTMLElement | null)?.blur();

    const top = catalogTopRef.current;
    if (top) {
      const navbarOffset = 88;
      const y = top.getBoundingClientRect().top + window.scrollY - navbarOffset;

      window.scrollTo({
        top: Math.max(0, y),
        behavior: "smooth",
      });
    }

    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <>
      <SEO
        title="Browse Books"
        description="Explore our full collection of digital books across all genres. Filter by category, rating, and more."
        url="/books"
      />

      <main className="min-h-screen">
        {/* Hero search section */}
        <section className="relative bg-navy pt-12 overflow-visible">
          {/* Background golden glow — decorative */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full sm:w-[600px] h-[300px]
            bg-golden/5 rounded-full blur-3xl"
            />
          </div>

          <div className="container-page relative z-10 text-center">
            <p className="text-golden text-xs font-semibold uppercase tracking-widest mb-3">
              Discover Your Next Great Read
            </p>
            <h1 className="!text-[2rem] min-[30rem]:!text-[2.5rem] text-text-light leading-tight mb-2">
              Explore and Search for
            </h1>
            <h1 className="!text-[2.25rem] min-[30rem]:!text-[2.75rem] leading-tight mb-10">
              <span className="text-golden">Any Book</span>
              <span className="text-text-light"> In Our Library</span>
            </h1>

            {/* BookFiltersComponent always visible — search + sort + filters */}
            <div className="max-w-3xl mx-auto">
              <BookFiltersComponent filters={filters} onChange={setFilters} />
            </div>
          </div>
        </section>

        {/* Recently viewed — only renders when localStorage has items */}
        {/* Hide recently viewed when filters are active — results should be front and center */}
        {!hasActiveFilters && <RecentlyViewedSection />}

        {/* Catalog section */}
        <div ref={catalogTopRef} />

        <section className="section bg-bg-dark">
          <div className="container-page">
            {/* Section heading */}
            <div className="mb-8">
              <h2 className="text-text-light uppercase tracking-wider">
                {/* Label changes based on whether the user is filtering or browsing */}
                {hasActiveFilters
                  ? discountLabel
                    ? `${discountLabel} Results`
                    : "Search Results"
                  : "All Library Books"}
              </h2>

              <div className="w-10 h-1 bg-golden rounded-full mt-1" />

              {!isLoading && (
                <p className="text-golden text-xs mt-2">
                  {totalCount.toLocaleString()}{" "}
                  {totalCount === 1 ? "book" : "books"} found
                </p>
              )}
            </div>

            {/* Loading state — skeleton grid */}
            {isLoading && (
              <BookGrid
                books={[]}
                isLoading={true}
                skeletonCount={totalBookToShow}
              />
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
              <BookGrid
                books={books}
                isLoading={false}
                skeletonCount={totalBookToShow}
              />
            )}

            {/* Pagination — only when there's more than one page */}
            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  className="btn-ghost btn-sm !border-golden/60 hover:!border-golden hover:!bg-dark
                    !text-text-muted flex items-center gap-1 disabled:!border-bg-hover"
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
                            ? "bg-golden text-black"
                            : "btn-ghost text-text-muted"
                        }`}
                        onClick={() => goToPage(page as number)}
                      >
                        {page}
                      </button>
                    ),
                  )}

                <button
                  className="btn-ghost btn-sm !border-golden/60 hover:!border-golden hover:!bg-dark
                    !text-text-muted flex items-center gap-1 disabled:!border-bg-hover"
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
      </main>
    </>
  );
}
