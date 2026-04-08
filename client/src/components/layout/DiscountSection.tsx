// Import React Router for navigation
import { useNavigate } from "react-router-dom";

// Import icon
import { ChevronRight } from "lucide-react";

// Import the books hook to fetch real discounted books
import { useBooks } from "../../hooks/useBooks";

const DiscountSection = () => {
  const navigate = useNavigate();

  // Fetch top bestselling books for card 1 (Summer Sale)
  const { data: bestsellerData } = useBooks({
    sortBy: "purchaseCount",
    sortOrder: "desc",
    limit: 2,
  });

  // Fetch top rated books for card 2 (Daily Deal)
  const { data: topRatedData } = useBooks({
    sortBy: "rating",
    sortOrder: "desc",
    limit: 2,
  });

  const bestsellerCovers = bestsellerData?.books ?? [];
  const topRatedCovers = topRatedData?.books ?? [];

  return (
    <section className="section bg-bg-dark">
      <div className="container-page">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* ── Card 1: Summer Sale — top bestsellers ── */}
          <div
            className="relative overflow-hidden rounded-2xl cursor-pointer min-h-[200px] flex items-center group"
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            }}
            onClick={() =>
              navigate("/books?sortBy=purchaseCount&sortOrder=desc")
            }
          >
            {/* Decorative background circle */}
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

            {/* Real book covers — fanned decoratively */}
            <div
              className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2
                opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            >
              {/* Show up to 2 real covers — skip slot if no book */}
              {[0, 1].map((i) => {
                const book = bestsellerCovers[i];
                if (!book) return null;
                return (
                  <div
                    key={book._id}
                    className={`w-20 rounded-lg overflow-hidden shadow-2xl
                      ${i === 0 ? "rotate-[-8deg] translate-y-2" : "rotate-[4deg]"}`}
                  >
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover aspect-[2/3]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/placeholder-cover.webp";
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Text */}
            <div className="relative z-10 p-8">
              <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-2">
                Summer Sale
              </p>
              <h3 className="text-white text-4xl font-black mb-4">
                Sale <span className="text-teal">25% OFF</span>
              </h3>
              <button
                className="flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold
                  px-5 py-2.5 rounded-full hover:bg-teal hover:text-white transition-all duration-200"
              >
                Shop Now
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* ── Card 2: Daily Deal — top rated ── */}
          <div
            className="relative overflow-hidden rounded-2xl cursor-pointer min-h-[200px] flex items-center group"
            style={{
              background: "linear-gradient(135deg, #0f3d3d 0%, #134e4a 100%)",
            }}
            onClick={() => navigate("/books?sortBy=rating&sortOrder=desc")}
          >
            {/* Decorative background circle */}
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-teal/10 rounded-full blur-2xl" />

            {/* Real book covers */}
            <div
              className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2
                            opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            >
              {[0, 1].map((i) => {
                const book = topRatedCovers[i];
                if (!book) return null;
                return (
                  <div
                    key={book._id}
                    className={`w-20 rounded-lg overflow-hidden shadow-2xl
                      ${i === 0 ? "rotate-[-4deg] translate-y-2" : "rotate-[6deg]"}`}
                  >
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover aspect-[2/3]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/images/placeholder-cover.webp";
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Text */}
            <div className="relative z-10 p-8">
              <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-2">
                Novel Every Day
              </p>
              <h3 className="text-white text-4xl font-black mb-4">
                Sale <span className="text-teal">45% OFF</span>
              </h3>
              <button
                className="flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold
                  px-5 py-2.5 rounded-full hover:bg-teal hover:text-white transition-all duration-200"
              >
                Shop Now
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscountSection;
