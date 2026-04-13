// Import React Router for navigation
import { useNavigate } from "react-router-dom";

// Import icon
import { ChevronRight } from "lucide-react";

// Import the books hook to fetch real discounted books
import { useBooks } from "../../hooks/useBooks";

// These are the promo levels we want to show on the homepage.
const DISCOUNT_TARGETS = [25, 45] as const;

// This keeps the promo matching close to the label shown on the card.
const DISCOUNT_TOLERANCE = 5;

// This type describes one homepage discount promo card.
interface DiscountPromoCard {
  target: (typeof DISCOUNT_TARGETS)[number];
  label: string;
  sublabel: string;
  sortBy: "createdAt";
  sortOrder: "desc";
  covers: Array<{
    _id: string;
    title: string;
    coverImage: string;
  }>;
}

// This calculates the real discount percent from the two prices.
const getDiscountPercent = (
  price?: number,
  discountPrice?: number,
): number | null => {
  // This skips books that are not discounted.
  if (
    typeof price !== "number" ||
    typeof discountPrice !== "number" ||
    price <= 0 ||
    discountPrice >= price
  ) {
    return null;
  }

  return Math.round(((price - discountPrice) / price) * 100);
};

const DealsSection = () => {
  const navigate = useNavigate();

  // This fetches the newest books first so new discounted books win.
  const { data: latestData } = useBooks({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 50,
  });

  // This gives us a flat list of books from the API response.
  const books = latestData?.books ?? [];

  // This stores books already used so one book does not appear in two cards.
  const usedBookIds = new Set<string>();

  // This builds only the promo cards that have matching discounted books.
  const promoCards: DiscountPromoCard[] = DISCOUNT_TARGETS.map((target) => {
    // This keeps only books whose discount is close to the current target.
    const covers = books
      .filter((book) => {
        // This avoids reusing the same book in another promo card.
        if (usedBookIds.has(book._id)) return false;

        // This gets the book's real discount percent.
        const discountPercent = getDiscountPercent(
          book.price,
          book.discountPrice,
        );
        if (discountPercent === null) return false;

        // This checks if the discount is close enough to the promo label.
        return Math.abs(discountPercent - target) <= DISCOUNT_TOLERANCE;
      })
      // This keeps the newest matching books first.
      .slice(0, 2)
      // This keeps only the cover data the banner needs.
      .map((book) => ({
        _id: book._id,
        title: book.title,
        coverImage: book.coverImage,
      }));

    // This reserves each selected book so it cannot appear twice.
    covers.forEach((book) => usedBookIds.add(book._id));

    return {
      target,
      label: target === 25 ? "Fresh" : "Big Savings",
      sublabel: target === 25 ? "Newly Added Deals" : "Hot Price Drops",
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
      covers,
    };
  }).filter((card) => card.covers.length > 0);

  return (
    <div className="flex flex-col gap-6 order-2 lg:order-1 lg:h-[460px]">
      {promoCards.map((card, index) => (
        <div
          key={card.target}
          className="relative overflow-hidden rounded-2xl flex-1 flex items-center group"
          style={{
            background:
              index === 0
                ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
                : "linear-gradient(135deg, #0f3d3d 0%, #134e4a 100%)",
          }}
        >
          {/* This adds a soft glowing shape behind the promo card. */}
          <div
            className={`absolute w-48 h-48 rounded-full blur-2xl ${
              index === 0
                ? "-right-8 -top-8 bg-white/5"
                : "-right-8 -bottom-8 bg-teal/10"
            }`}
          />

          {/* This shows up to two matching discounted book covers. */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2
                  opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          >
            {card.covers.map((book, coverIndex) => (
              <div
                key={book._id}
                className={`w-14 sm:w-20 rounded-lg overflow-hidden shadow-2xl ${
                  index === 0
                    ? coverIndex === 0
                      ? "rotate-[-8deg] translate-y-2"
                      : "rotate-[4deg]"
                    : coverIndex === 0
                      ? "rotate-[-4deg] translate-y-2"
                      : "rotate-[6deg]"
                }`}
              >
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover aspect-[2/3]"
                  onError={(e) => {
                    // This swaps in a placeholder if a cover cannot load.
                    (e.target as HTMLImageElement).src =
                      "/images/placeholder-cover.webp";
                  }}
                />
              </div>
            ))}
          </div>

          {/* This is the text block shown on the left side of the card. */}
          <div className="relative z-10 p-8">
            <p
              className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-2 ${
                index === 0 ? "text-purple-300" : "text-teal"
              }`}
            >
              {card.sublabel}
            </p>
            <h3 className="text-white sm:!text-3xl font-black mb-4">
              {card.label} <span className="text-teal">{card.target}% OFF</span>
            </h3>
            <button
              className="flex items-center gap-2 bg-white text-gray-900 
                  btn btn-sm sm:btn-md rounded-full hover:bg-teal hover:text-white"
              onClick={() =>
                navigate(
                  `/books?sortBy=${card.sortBy}&sortOrder=${card.sortOrder}`,
                )
              }
            >
              Shop Now
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DealsSection;
