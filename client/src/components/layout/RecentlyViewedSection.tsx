import { useAuthStore } from "../../store/auth";
import {
  useFetchRecentlyViewed,
  useRecentlyViewed,
} from "../../hooks/useRecentlyViewed";
import { RecentlyViewedCarousel } from "../features";

// Skeleton row — matches the exact height and structure of the real carousel
// so the page doesn't shift when the real content loads
const RecentlyViewedSkeleton = () => (
  <div className="bg-bg-dark">
    <div className="container-page pt-8 pb-0">
      {/* Header skeleton — same markup as the real header */}
      <div className="mb-6">
        <div className="skeleton h-3.5 w-32 rounded mb-2" />{" "}
        {/* "Recently Viewed" label */}
        <div className="skeleton h-1 w-10 rounded-full" />{" "}
        {/* Golden underline bar */}
      </div>

      {/* Carousel skeleton — 5 book card placeholders at the same aspect ratio */}
      <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-hidden pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            // Same basis calculations as carouselItemClassName in RecentlyViewedCarousel
            className="shrink-0 basis-[calc(27.333%-0.35rem)] min-[30rem]:basis-[calc(21.666%-0.475rem)] 
              sm:basis-[calc(17.666%-0.5rem)] md:basis-[calc(15.333%-1rem)] lg:basis-[calc(13.666%-1.35rem)]"
          >
            <div className="flex flex-col">
              <div className="skeleton w-full aspect-[2/3] rounded-lg mb-3" />{" "}
              {/* Cover */}
              <div className="skeleton h-3.5 w-full rounded mb-1.5" />{" "}
              {/* Title line 1 */}
              <div className="skeleton h-3.5 w-3/4 rounded mb-1.5" />{" "}
              {/* Title line 2 */}
              <div className="skeleton h-3 w-1/2 rounded mb-1.5" />{" "}
              {/* Category */}
              <div className="skeleton h-3.5 w-1/3 rounded mt-1" />{" "}
              {/* Price */}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RecentlyViewedSection = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { books: serverBooks, isLoading } = useFetchRecentlyViewed(); // Logged-in: server fetch
  const { books: guestBooks } = useRecentlyViewed(); // Guests: localStorage

  const books = isAuthenticated ? serverBooks : guestBooks;

  // While the server fetch is in flight, show the skeleton to reserve space
  // Guests skip this — their data is synchronous from localStorage
  if (isAuthenticated && isLoading) return <RecentlyViewedSkeleton />;

  // No history yet — render nothing, no layout impact
  if (books.length === 0) return null;

  return (
    <div className="bg-bg-dark">
      <div className="container-page pt-8 pb-0">
        <div className="mb-6">
          <h2 className="text-text-light uppercase tracking-wider text-sm sm:text-base">
            Recently Viewed
          </h2>
          <div className="w-10 h-1 bg-golden rounded-full mt-1" />
        </div>

        <RecentlyViewedCarousel books={books} />
      </div>
    </div>
  );
};

export default RecentlyViewedSection;
