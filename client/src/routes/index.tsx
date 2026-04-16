import { useFeaturedBooks } from "../hooks/useBooks";
import SEO from "../components/common/SEO";
import { WebSiteJsonLd } from "../components/common/JsonLd";
import {
  Hero,
  RecommendedSection,
  AuthorsSection,
  DealsSection,
  NewArrivalsSection,
  CTASection,
} from "../components/layout";

export default function HomePage() {
  const { data: featuredBooks, isLoading: featuredLoading } =
    useFeaturedBooks();

  const heroBooks = featuredBooks ?? [];

  return (
    <>
      <SEO
        title="Home"
        description="Discover and buy digital books at Kun Bookshop. Instant access to your library after purchase."
        url="/"
      />
      <WebSiteJsonLd />
      <div className="min-h-screen">
        <Hero books={heroBooks} isLoading={featuredLoading} />

        <RecommendedSection />

        {/* Combined section — stacked discount cards left, new arrivals 2x2 right */}
        <section className="section bg-bg-dark">
          <div className="container-page">
            {/* Section header */}
            <div className="mb-8">
              <h2 className="text-text-light uppercase tracking-wider">
                New Arrivals & Deals
              </h2>
              <div className="w-12 h-1 bg-golden rounded-full mt-2" />
            </div>

            {/* Two-column layout — discount cards left, new arrivals right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left column — stacked discount promo cards */}
              <DealsSection />

              {/* Right column — 2x2 new arrival book covers */}
              <NewArrivalsSection />
            </div>
          </div>
        </section>

        <AuthorsSection />

        <CTASection />
      </div>
    </>
  );
}
