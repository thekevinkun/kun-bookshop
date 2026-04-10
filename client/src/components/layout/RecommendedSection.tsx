import { useRecommendations } from "../../hooks/useBooks";
import { useAuthStore } from "../../store/auth";

import { BookGrid } from "../features";

const RecommendedSection = () => {
  const { isAuthenticated } = useAuthStore();

  // Hook is disabled when user is not logged in — no request fires
  const { data, isLoading } = useRecommendations(isAuthenticated);

  // Don't render the section at all for guests
  if (!isAuthenticated) return null;

  // Don't render if we finished loading and got nothing back
  if (!isLoading && (!data?.books || data.books.length === 0)) return null;

  const books = data?.books ?? [];

  return (
    // Matches the exact className pattern of the Latest Books section
    <section className="section bg-bg-dark">
      <div className="container-page">
        {/* Section header — same structure as Latest Books */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-1">
              {data?.personalised
                ? "Based on your purchase history"
                : "Popular picks to get you started"}
            </p>
            <h2 className="text-text-light uppercase tracking-wider">
              {/* Label switches once they have purchase history */}
              {data?.personalised ? "Recommended for You" : "Top Rated Books"}
            </h2>
            <div className="w-10 h-1 bg-teal rounded-full mt-2" />
          </div>
        </div>

        {/* Empty state — same copy style as Latest Books */}
        {!isLoading && books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-6xl mb-4">📚</p>
            <h3 className="text-text-light mb-2">No recommendations yet</h3>
            <p className="text-text-muted text-sm">
              Start exploring and purchasing books to get personalised picks.
            </p>
          </div>
        ) : (
          // BookGrid handles skeleton loading state internally
          <BookGrid books={books} isLoading={isLoading} skeletonCount={10} />
        )}
      </div>
    </section>
  );
};

export default RecommendedSection;
