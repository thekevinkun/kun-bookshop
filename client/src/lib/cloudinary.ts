// The base segment that appears in every Cloudinary upload URL
// We'll use this to find the right place to inject transformation params
const UPLOAD_SEGMENT = "/upload/";

// Define the possible use contexts for a cover image
// Each context gets different dimensions — no point shipping a full-res image for a tiny card
export type CloudinaryImageContext =
  | "card" // BookCard grid — 400px wide max
  | "card-compact" // NewArrivalsSection inlined compact cards — 300px
  | "hero" // Hero section featured book — 800px
  | "detail" // Book detail page hero — 800px
  | "author" // Author avatar — 200px square
  | "thumbnail"; // Very small use (admin tables, order summaries) — 120px

// Map each context to the Cloudinary transform string
// f_auto  = serve the best format the browser supports (WebP, AVIF, or JPG fallback)
// q_auto  = perceptual quality compression — Cloudinary picks the lowest quality humans won't notice
// w_N     = resize to N pixels wide, height scales automatically (aspect ratio preserved)
// c_fill  = for author avatars we also crop to a square
const TRANSFORMS: Record<CloudinaryImageContext, string> = {
  card: "f_auto,q_auto,w_400",
  "card-compact": "f_auto,q_auto,w_300",
  hero: "f_auto,q_auto,w_800",
  detail: "f_auto,q_auto,w_800",
  author: "f_auto,q_auto,w_200,h_200,c_fill",
  thumbnail: "f_auto,q_auto,w_120",
};

// Build an optimized Cloudinary URL by injecting transforms after /upload/
// Falls back to the original URL if it doesn't look like a Cloudinary URL
// so placeholder images and test data never break
export const getCoverUrl = (
  url: string | undefined | null,
  context: CloudinaryImageContext = "card",
): string => {
  // If there's no URL at all, return empty string — the onError fallback handles it
  if (!url) return "";

  // If this isn't a Cloudinary URL, return it as-is (local dev placeholders, etc.)
  if (!url.includes("res.cloudinary.com")) return url;

  // If it already has transforms injected (e.g. signed preview URLs), don't double-inject
  if (url.includes(UPLOAD_SEGMENT) && !url.includes(UPLOAD_SEGMENT + "v")) {
    return url;
  }

  // Find the position right after "/upload/" and inject our transform string there
  // Example: ".../upload/v17760.../file.jpg" → ".../upload/f_auto,q_auto,w_400/v17760.../file.jpg"
  const insertAt = url.indexOf(UPLOAD_SEGMENT) + UPLOAD_SEGMENT.length;

  return (
    url.slice(0, insertAt) + // everything up to and including "/upload/"
    TRANSFORMS[context] +
    "/" + // our transform params + separator
    url.slice(insertAt) // the rest: version + public_id + extension
  );
};
