export const BOOK_CATEGORY_BUCKETS = [
  { key: "fiction", label: "Fiction" },
  { key: "fantasy", label: "Fantasy" },
  { key: "romance", label: "Romance" },
  { key: "mystery-crime", label: "Mystery & Crime" },
  { key: "sci-fi-dystopian", label: "Sci-Fi & Dystopian" },
  { key: "historical-fiction", label: "Historical Fiction" },
  { key: "business-finance", label: "Business & Finance" },
  { key: "psychology-self-help", label: "Psychology & Self-Help" },
  { key: "philosophy", label: "Philosophy" },
  { key: "science", label: "Science" },
  { key: "history", label: "History" },
] as const;

export type BookCategoryBucketKey =
  (typeof BOOK_CATEGORY_BUCKETS)[number]["key"];

// Sort options — these don't come from the DB, they're fixed UI choices
export const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt", order: "desc" },
  { label: "Oldest", value: "createdAt", order: "asc" },
  { label: "Price: Low to High", value: "price", order: "asc" },
  { label: "Price: High to Low", value: "price", order: "desc" },
  { label: "Top Rated", value: "rating", order: "desc" },
  { label: "Bestselling", value: "purchaseCount", order: "desc" },
];

export const FOOTER_NAV_LINKS = [
  { label: "Browse Books", to: "/books" },
  { label: "New Arrivals", to: "/books?sortBy=createdAt" },
  { label: "Top Rated", to: "/books?sortBy=rating" },
  { label: "Featured", to: "/books?sortBy=purchaseCount" },
  { label: "My Library", to: "/library" },
  { label: "Privacy Policy", to: "#" },
] as const;

export const FOOTER_SOCIAL_LINKS = [
  { label: "Twitter", href: "https://x.com/thekevinkun" },
  { label: "Instagram", href: "https://instagram.com/thekevinkun" },
  { label: "GitHub", href: "https://github.com/thekevinkun" },
] as const;

export const FOOTER_CONTACT = {
  email: "hello@kunbookshop.com",
  availability: "Available worldwide",
  supportText: "Digital books, instant delivery, secure checkout.",
} as const;
