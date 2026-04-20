import { Helmet } from "react-helmet-async"; // injects tags into <head> dynamically

// The props this component accepts — all optional except title
interface SEOProps {
  title?: string; // page title shown in browser tab and Google results
  description?: string; // short summary shown under the title in Google results
  image?: string; // image shown when shared on social media (Open Graph)
  url?: string; // canonical URL of this page — tells Google the "real" address
  type?: "website" | "article" | "book"; // Open Graph content type
  noIndex?: boolean; // if true, tells Google NOT to index this page (e.g. admin pages)
  author?: string; // optional author name — used on book detail pages
}

// The site name used in every title — change this if the brand name changes
const SITE_NAME = "Kun Bookshop";

// The fallback description used when a page doesn't provide its own
const DEFAULT_DESCRIPTION =
  "Discover and buy digital books at Kun Bookshop. Instant access to your library after purchase.";

// The fallback image used when a page doesn't provide a social share image
const DEFAULT_IMAGE = "/og-image.png";

// The production URL of your site — used for canonical URLs and OG URLs
// Vite exposes env vars via import.meta.env — set VITE_SITE_URL in your .env
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
  author,
}: SEOProps) {
  // Build the full title — if a page passes "Fantasy Books", we show "Fantasy Books | Kun Bookshop"
  // If no title is passed (e.g. homepage), we just show "Kun Bookshop"
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  // Build the absolute image URL — if the image is already a full URL (Cloudinary), use it as-is
  // If it's a relative path like "/og-image.png", prepend the site URL
  const absoluteImage = image.startsWith("http")
    ? image
    : `${SITE_URL}${image}`;

  // Build the canonical URL — if a specific URL is passed use it, otherwise use current page
  const canonicalUrl = url ? `${SITE_URL}${url}` : undefined;

  return (
    <Helmet>
      {/* Basic HTML meta tags   */}

      {/* The page title shown in browser tabs and Google search results */}
      <title>{fullTitle}</title>

      {/* The page description shown under the title in Google search results */}
      <meta name="description" content={description} />

      {/* Author meta tag — shown in some search engines and RSS readers */}
      {author && <meta name="author" content={author} />}

      {/* If noIndex is true, tell Google not to index or follow links on this page */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL — tells Google which URL is the "real" one to avoid duplicate content */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph tags        */}
      {/* Used by Facebook, LinkedIn, WhatsApp when someone shares a link */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card tags      */}
      {/* Used by Twitter/X when someone shares a link */}

      {/* summary_large_image shows a big image preview card on Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
}
