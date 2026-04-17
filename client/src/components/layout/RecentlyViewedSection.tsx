import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import RecommendedCarousel from "../features/RecommendedCarousel"; // reuse the exact same carousel

const RecentlyViewedSection = () => {
  // Read from localStorage — synchronous, no loading state
  const books = useRecentlyViewed();

  // Render nothing if the user hasn't viewed any books yet
  // No empty state, no placeholder — just absent
  if (books.length === 0) return null;

  return (
    // Compact div — not a full section — so it doesn't dominate the Browse page
    <div className="bg-bg-dark">
      <div className="container-page pt-8 pb-0">
        {/* Section header — same pattern as the rest of BooksPage */}
        <div className="mb-6">
          <h2 className="text-text-light uppercase tracking-wider text-sm sm:text-base">
            Recently Viewed
          </h2>
          <div className="w-10 h-1 bg-golden rounded-full mt-1" />
        </div>

        {/* Reuse the exact same carousel component from RecommendedSection */}
        {/* No isLoading state needed — localStorage is synchronous */}
        <RecommendedCarousel books={books} isLoading={false} />
      </div>
    </div>
  );
};

export default RecentlyViewedSection;
