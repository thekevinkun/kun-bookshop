// Import React Router for navigation
import { useNavigate } from "react-router-dom";

// Import React Query to fetch real book data
import { useBooks } from "../../hooks/useBooks";

// Import icon
import { ChevronRight } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  // Fetch the top 4 bestselling books to use as decorative cover images
  // If no books exist yet, the covers simply don't render — section still looks fine
  const { data } = useBooks({
    sortBy: "purchaseCount",
    sortOrder: "desc",
    limit: 4,
  });
  const covers = data?.books ?? [];

  // Rotation and position classes for each cover in the fan layout
  // These match the original design — 4 books in a fanned cluster
  const coverStyles = [
    "absolute left-0 top-11 w-28 lg:w-32 rotate-[-12deg] scale-[0.94] opacity-80",
    "absolute left-20 top-1 w-32 lg:w-36 rotate-[-2deg] z-15",
    "absolute left-44 top-12 w-28 lg:w-32 rotate-[10deg] scale-[0.96] opacity-85 z-10",
    "absolute left-[248px] top-7 w-24 lg:w-28 rotate-[18deg] scale-[0.92] opacity-75",
  ];

  return (
    <section className="section bg-navy">
      <div className="container-page">
        <div
          className="relative overflow-hidden rounded-2xl min-h-[220px] flex items-center"
          style={{
            background:
              "linear-gradient(135deg, #0f4c4c 0%, #134e4a 60%, #0a1628 100%)",
          }}
        >
          {/* ── Left side — fanned book covers ── */}
          {/* Only rendered on md+ screens — decorative, not functional */}
          <div className="absolute left-8 top-1/2 hidden h-[240px] w-[380px] -translate-y-1/2 md:block">
            {/* Teal ambient glow behind the books */}
            <div className="absolute inset-0 rounded-full bg-teal/15 blur-3xl" />

            {/* Render real book covers — up to 4 */}
            {coverStyles.map((style, i) => {
              const book = covers[i];

              // If we don't have a real book for this slot yet, skip it gracefully
              if (!book) return null;

              return (
                <div
                  key={book._id}
                  className={`${style} rounded-xl overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.4)]`}
                >
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover aspect-[2/3]"
                    onError={(e) => {
                      // Fallback if the Cloudinary image fails to load
                      (e.target as HTMLImageElement).src =
                        "/images/placeholder-cover.webp";
                    }}
                  />
                </div>
              );
            })}

            {/* Gradient fade on the right edge to blend covers into background */}
            <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-r from-transparent via-[#134e4a]/50 to-[#134e4a]/15" />
          </div>

          {/* ── Right side — CTA text ── */}
          <div className="relative z-10 ml-auto w-full md:w-3/5 p-10 md:pr-16 text-right">
            <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-2">
              Our Biggest Deal
            </p>
            <h2 className="text-white !text-4xl mb-1">
              PDF & ePub delivered
            </h2>
            <h2 className="text-white mb-3">
              straight to your <span className="text-teal">inbox</span>
            </h2>
            <p className="text-white/60 text-sm mb-6 max-w-sm ml-auto">
              Purchase any book and receive your file instantly via email. No
              waiting. No shipping. Just reading.
            </p>
            <button
              className="gap-2 bg-white text-gray-900 
                btn btn-md rounded-full hover:bg-teal hover:text-white"
              onClick={() => navigate("/books")}
            >
              Shop Now
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
