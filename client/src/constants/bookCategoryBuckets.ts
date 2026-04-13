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

export type BookCategoryBucketKey = (typeof BOOK_CATEGORY_BUCKETS)[number]["key"];
