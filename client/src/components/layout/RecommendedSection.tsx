import { useAuthStore } from "../../store/auth";
import { useRecommendations } from "../../hooks/useBooks";

import { RecommendedCarousel } from "../features";

const RecommendedSection = () => {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const { data, isLoading } = useRecommendations();

  // While Zustand is still reading from localStorage, treat it as loading.
  // This prevents the section from rendering a guest fetch result
  // that will be immediately invalidated once the real user is known.
  const loading = !isHydrated || isLoading;

  if (!loading && (!data?.books || data.books.length === 0)) return null;

  const books = data?.books ?? [];

  return (
    <section className="section bg-bg-dark">
      <div className="container-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-golden text-xs font-semibold uppercase tracking-widest mb-1">
              {data?.personalised
                ? "Based on your purchase history"
                : "Popular picks worth discovering"}
            </p>
            <h2 className="text-text-light uppercase tracking-wider">
              {data?.personalised ? "Recommended for You" : "Popular Picks"}
            </h2>
            <div className="w-10 h-1 bg-golden rounded-full mt-2" />
          </div>
        </div>

        {!loading && books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-6xl mb-4">📚</p>
            <h3 className="text-text-light mb-2">No recommendations yet</h3>
            <p className="text-text-muted text-sm">
              Explore, wishlist, and purchase books to unlock personalised
              picks.
            </p>
          </div>
        ) : (
          <RecommendedCarousel
            books={books}
            isLoading={loading}
            skeletonCount={10}
          />
        )}
      </div>
    </section>
  );
};

export default RecommendedSection;
