import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Tag } from "lucide-react";
import { useActiveCoupons } from "../../hooks/useCoupons";

const CouponBanner = () => {
  const location = useLocation(); // Check current route
  const { data: coupons = [] } = useActiveCoupons();

  // Track which coupon is currently displayed
  const [activeIndex, setActiveIndex] = useState(0);

  // Cycle through coupons every 6 seconds when there are multiple
  useEffect(() => {
    if (coupons.length <= 1) return; // No cycling needed for 0 or 1 coupon

    const interval = setInterval(() => {
      // Move to next coupon, wrap back to 0 after the last one
      setActiveIndex((prev) => (prev + 1) % coupons.length);
    }, 6000); // 6 seconds per coupon

    return () => clearInterval(interval); // Cleanup on unmount
  }, [coupons.length]);

  // Only show on homepage — disappears on all other pages
  if (location.pathname !== "/") return null;

  // No active coupons — render nothing, take up no space
  if (coupons.length === 0) return null;

  const coupon = coupons[activeIndex]; // The coupon currently on display

  // Build the human-readable discount label
  const discountLabel =
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}% OFF${coupon.maxDiscount ? ` (up to $${coupon.maxDiscount})` : ""}`
      : `$${coupon.discountValue} OFF`;

  // Build the minimum purchase note if applicable
  const minNote =
    coupon.minPurchase && coupon.minPurchase > 0
      ? ` on orders over $${coupon.minPurchase}`
      : "";

  return (
    // Fixed positioning handled by Navbar — this just fills the banner slot
    <div
      className="w-full bg-gradient-to-r from-teal/20 via-golden/10 to-teal/20
      border-b border-white/10 overflow-hidden relative"
    >
      {/* Subtle shimmer sweep — runs continuously, reinforces "limited offer" feel */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]
          bg-gradient-to-r from-transparent via-white/5 to-transparent"
        />
      </div>

      {/* Crossfade container — AnimatePresence swaps coupons with opacity only */}
      <div className="relative h-9 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={coupon.code} // Key change triggers the crossfade
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }} // Smooth 0.5s crossfade
            className="flex items-center gap-2 text-xs sm:text-sm text-text-light"
          >
            {/* Tag icon — signals this is a deal */}
            <Tag className="w-3.5 h-3.5 text-golden flex-shrink-0" />

            {/* The offer text */}
            <span>
              Use code{" "}
              {/* Coupon code styled as a pill — easy to copy visually */}
              <span
                className="font-mono font-bold text-golden bg-golden/10
                px-1.5 py-0.5 rounded border border-golden/30"
              >
                {coupon.code}
              </span>{" "}
              for{" "}
              <span className="font-semibold text-teal">{discountLabel}</span>
              {minNote}
            </span>

            {/* Dot separator — only shown when there are multiple coupons */}
            {coupons.length > 1 && (
              <span className="flex gap-1 ml-2">
                {coupons.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1 h-1 rounded-full transition-all duration-300
                      ${i === activeIndex ? "bg-golden w-3" : "bg-white/30"}`}
                  />
                ))}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CouponBanner;
