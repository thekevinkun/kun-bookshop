// Reusable star rating display with half-star support.
//
// Rounding rule (matches Amazon, Goodreads):
//   X.00 – X.24 → X full stars
//   X.25 – X.74 → X full + 1 half star
//   X.75 – X+1  → X+1 full stars
//
// So: 4.3 → 4 full, 4.5 → 4 full + half, 4.7 → 4 full + half, 4.8 → 5 full

interface StarRatingProps {
  rating: number; // The decimal average, e.g. 4.5 or 4.7
  size?: number; // Icon size in px — defaults to 14
  className?: string; // Extra classes on the wrapper div
}

const StarRating = ({ rating, size = 14, className = "" }: StarRatingProps) => {
  // Determine how many full, half, and empty stars to show
  // We clamp rating to [0, 5] first so bad data can't break the layout.
  const clamped = Math.min(5, Math.max(0, rating));

  // Floor gives us the number of definitely-full stars
  const fullStars = Math.floor(clamped);

  // Fractional part decides whether the next star is half or full
  const fraction = clamped - fullStars;

  // fraction < 0.25 → no extra star (empty)
  // fraction 0.25–0.74 → half star
  // fraction >= 0.7 → promote to full star
  const hasHalf = fraction >= 0.25 && fraction < 0.7;
  const extraFull = fraction >= 0.7 ? 1 : 0;

  // Total filled positions — used to calculate empty stars
  const filledCount = fullStars + extraFull;
  const emptyStars = 5 - filledCount - (hasHalf ? 1 : 0);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Full stars */}
      {Array.from({ length: filledCount }).map((_, i) => (
        <svg
          key={`full-${i}`}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {/* A fully filled star */}
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            className="fill-warning stroke-warning"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}

      {/* Half star */}
      {hasHalf && (
        <svg
          key="half"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <defs>
            {/* 
              Clip the left half of the star to golden, right half stays empty.
              Using a unique id per size to avoid SVG id collisions if multiple
              StarRating instances are on the same page.
            */}
            <clipPath id={`half-clip-${size}`}>
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>

          {/* Empty star background — the full outline in muted color */}
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            className="fill-bg-hover stroke-bg-hover"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Golden left half — clipped to exactly 50% width */}
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            className="fill-warning stroke-warning"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#half-clip-${size})`}
          />
        </svg>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg
          key={`empty-${i}`}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            className="fill-bg-hover stroke-bg-hover"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
};

export default StarRating;
