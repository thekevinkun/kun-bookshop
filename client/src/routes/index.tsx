// Import hooks for fetching featured and latest books from the real API
import { useFeaturedBooks, useBooks } from "../hooks/useBooks";

// Import layout sections
import {
  Hero,
  AuthorsSection,
  DiscountSection,
  CTASection,
} from "../components/layout";

// Import BookGrid for the latest books section
import { BookGrid } from "../components/features";

export default function HomePage() {
  // Fetch featured books for the hero carousel from the real API
  const { data: featuredBooks, isLoading: featuredLoading } =
    useFeaturedBooks();

  // Fetch latest books sorted by creation date
  const { data: latestData, isLoading: latestLoading } = useBooks({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 10,
  });

  // Use real data directly — no placeholder fallbacks
  const heroBooks = featuredBooks ?? [];
  const latestBooks = latestData?.books ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero carousel — only renders when there are featured books */}
      {/* We still render Hero with an empty array so it can show its own empty state */}
      <Hero books={heroBooks} isLoading={featuredLoading} />

      {/* Latest books section */}
      <section className="section bg-bg-dark">
        <div className="container-page">
          <div className="mb-8">
            <h2 className="text-text-light text-2xl font-bold uppercase tracking-wider">
              Latest Books
            </h2>
            <div className="w-12 h-1 bg-teal rounded-full mt-2" />
          </div>

          {/* Empty state — shown when loading is done but no books exist yet */}
          {!latestLoading && latestBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-6xl mb-4">📚</p>
              <h3 className="text-text-light text-lg font-semibold mb-2">
                No books yet
              </h3>
              <p className="text-text-muted text-sm">
                The catalog is empty — check back soon.
              </p>
            </div>
          ) : (
            // BookGrid handles the skeleton loading state internally via isLoading
            <BookGrid
              books={latestBooks}
              isLoading={latestLoading}
              skeletonCount={15}
            />
          )}
        </div>
      </section>

      {/* Authors carousel — fetches its own data internally */}
      <AuthorsSection />

      {/* Discount banners */}
      <DiscountSection />

      {/* CTA section */}
      <CTASection />
    </div>
  );
}
