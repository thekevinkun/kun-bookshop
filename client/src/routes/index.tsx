import { useFeaturedBooks } from "../hooks/useBooks";

import {
  Hero,
  RecommendedSection,
  AuthorsSection,
  DiscountSection,
  CTASection,
} from "../components/layout";

export default function HomePage() {
  const { data: featuredBooks, isLoading: featuredLoading } =
    useFeaturedBooks();

  const heroBooks = featuredBooks ?? [];

  return (
    <div className="min-h-screen">
      <Hero books={heroBooks} isLoading={featuredLoading} />

      <RecommendedSection />

      <AuthorsSection />

      <DiscountSection />

      <CTASection />
    </div>
  );
}
