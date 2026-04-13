export const BOOK_CATEGORY_BUCKETS = {
  fiction: ["Literary Fiction", "Contemporary Literary Fiction", "Realism"],
  fantasy: ["Fantasy"],
  romance: ["Romance", "Slice of Life"],
  "mystery-crime": [
    "Crime",
    "Crime Fiction",
    "Detective Fiction",
    "Murder Mystery",
    "Mystery",
    "Surveillance Thriller",
    "Psychological Fiction",
  ],
  "sci-fi-dystopian": [
    "Science Fiction",
    "Social Science Fiction",
    "Dystopian Fiction",
    "Apocalyptic Fiction",
  ],
  "historical-fiction": ["Historical Fiction", "Political Fiction"],
  "business-finance": ["Business", "Finance"],
  "psychology-self-help": [
    "Psychology",
    "Self-Help",
    "Personal Development",
  ],
  philosophy: ["Philosophy", "Philosophical Fiction", "Political Satire"],
  science: ["Science", "Astronomy"],
  history: ["History"],
} as const;

export type BookCategoryBucketKey = keyof typeof BOOK_CATEGORY_BUCKETS;
