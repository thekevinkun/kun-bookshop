import { Helmet } from "react-helmet-async"; // injects the script tag into <head>

// Book/Product schema — used on the Book Detail page
// Tells Google this page is about a purchasable book
interface BookJsonLdProps {
  id: string; // MongoDB _id — used to build the page URL
  title: string; // book title
  description: string; // book description
  image: string; // cover image URL (Cloudinary)
  authorName: string; // denormalized author string — always use authorName, never author
  price: number; // current price in USD
  rating?: number; // average rating (0–5)
  ratingCount?: number; // how many people rated it
  publishedDate?: string; // ISO date string e.g. "2024-01-15"
}

// The production site URL — must match what's in your .env
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

export function BookJsonLd({
  id,
  title,
  description,
  image,
  authorName,
  price,
  rating,
  ratingCount,
  publishedDate,
}: BookJsonLdProps) {
  // Build the structured data object following schema.org/Book spec
  // Google reads this to show rich results like star ratings and price
  const schema = {
    "@context": "https://schema.org", // tells Google we're using schema.org vocabulary
    "@type": "Book", // this page is about a Book
    name: title,
    description: description.slice(0, 300), // keep description concise for structured data
    image,
    url: `${SITE_URL}/books/${id}`, // canonical URL of this book's page
    author: {
      "@type": "Person", // the author is a Person (not an Organization)
      name: authorName,
    },
    // datePublished is optional — only include it if we have the value
    ...(publishedDate && { datePublished: publishedDate }),

    // Offer tells Google this book can be purchased — enables price in rich results
    offers: {
      "@type": "Offer",
      price: price.toFixed(2), // format as "9.99" not 9.9999
      priceCurrency: "USD",
      availability: "https://schema.org/InStock", // always in stock (digital)
      url: `${SITE_URL}/books/${id}`,
    },

    // AggregateRating is optional — only include if we have real rating data
    // Google will show stars in search results if this is present
    ...(rating &&
      ratingCount && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: rating.toFixed(1), // e.g. "4.3"
          reviewCount: ratingCount, // how many reviews this rating is based on
          bestRating: "5", // max possible rating
          worstRating: "1", // min possible rating
        },
      }),
  };

  return (
    <Helmet>
      {/* JSON-LD is injected as a <script> tag in <head> — Google reads it without executing it */}
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// WebSite schema — used on the Homepage only
// Enables the Google sitelinks search box when someone searches your brand name
interface WebSiteJsonLdProps {
  siteUrl?: string; // optional override — defaults to VITE_SITE_URL
}

export function WebSiteJsonLd({ siteUrl = SITE_URL }: WebSiteJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite", // this is the homepage of a website
    name: "Kun Bookshop",
    url: siteUrl,

    // SearchAction tells Google that users can search your site directly from Google
    // Google may show a search box under your result when someone searches "Kun Bookshop"
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        // {search_term_string} is a placeholder Google replaces with the user's query
        urlTemplate: `${siteUrl}/browse?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
