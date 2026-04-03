import { useFeaturedBooks } from "../hooks/useBooks";
import { useBooks } from "../hooks/useBooks";

import {
  Hero,
  AuthorsSection,
  DiscountSection,
  CTASection,
} from "../components/layout";
import { BookGrid } from "../components/features";

import { PLACEHOLDER_FEATURED, PLACEHOLDER_LATEST } from "../lib/data";

const HomePage = () => {
  // Try to use real featured books from the API — fall back to placeholders
  const { data: featuredBooks } = useFeaturedBooks();
  const { data: latestData, isLoading: latestLoading } = useBooks({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 15,
  });

  // Use real data if available, otherwise show placeholders
  const heroBooks =
    featuredBooks && featuredBooks.length > 0
      ? featuredBooks
      : PLACEHOLDER_FEATURED;

  const latestBooks =
    latestData?.books && latestData.books.length > 0
      ? latestData.books
      : PLACEHOLDER_LATEST;

  return (
    <div className="min-h-screen">
      {/* Hero carousel — full screen with auto-slide */}
      <Hero books={heroBooks} />

      {/* Latest books grid */}
      <section className="section bg-bg-dark">
        <div className="container-page">
          <div className="mb-8">
            <h2 className="text-text-light text-2xl font-bold uppercase tracking-wider">
              Latest Books
            </h2>
            <div className="w-12 h-1 bg-teal rounded-full mt-2" />
          </div>

          {/* 5-column grid, 3 rows minimum — BookGrid handles the layout */}
          <BookGrid
            books={latestBooks}
            isLoading={latestLoading}
            skeletonCount={15}
          />
        </div>
      </section>

      {/* AUTHORS SECTION */}
      <AuthorsSection />

      {/* DISCOUNT BANNERS */}
      <DiscountSection />

      {/* CTA SECTION */}
      <CTASection />
    </div>
  );
};

export default HomePage;
