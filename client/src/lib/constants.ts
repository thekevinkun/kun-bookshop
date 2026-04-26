export const BOOK_CATEGORY_BUCKETS = [
  { key: "fiction", label: "Fiction" },
  { key: "fantasy-adventure", label: "Fantasy & Adventure" },
  { key: "classics", label: "Classics" },
  { key: "romance-comedy", label: "Romance & Comedy" },
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
  { label: "Contact & Help", to: "/contact" },
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

// Topic category chips
// Each chip fires a preset message into KUN's chat when clicked
export const TOPIC_CHIPS = [
  { icon: "📥", label: "Downloads", text: "How do downloads work?" },
  { icon: "💳", label: "Payments", text: "How does payment work?" },
  { icon: "👤", label: "Account", text: "How do I manage my account?" },
  { icon: "📄", label: "Formats", text: "What formats do you support?" },
  { icon: "🎟", label: "Coupons", text: "How do coupons work?" },
  { icon: "📚", label: "My Library", text: "Show my library" },
] as const;

// FAQ data
// Hardcoded Q&A — no DB needed, these answers rarely change
export const FAQ_ITEMS = [
  {
    question: "How do I download a book after purchase?",
    answer:
      "After a successful purchase, the book is instantly added to your Library. Go to My Library, find the book, and click the Download button. The download link is valid for 1 hour — you can regenerate it anytime from your library.",
  },
  {
    question: "What formats are available?",
    answer:
      "We offer PDF and ePub formats. PDF books can be read directly in your browser with full progress tracking, or downloaded for offline use. ePub books are downloaded and opened in your preferred reading app (Apple Books, Google Play Books, Kindle, etc.).",
  },
  {
    question: "How do payments work?",
    answer:
      "All payments are processed securely by Stripe — one of the world's most trusted payment platforms. We accept all major credit and debit cards. Your card details are never stored on our servers.",
  },
  {
    question: "How do coupons work?",
    answer:
      "Coupons can be applied at checkout. Each coupon can only be used once per account. Coupons may have an expiry date and a minimum purchase requirement — KUN can validate any coupon code for you before you check out.",
  },
  {
    question: "Can I preview a book before buying?",
    answer:
      "Yes! PDF books have a free preview available — a limited number of pages you can read before purchasing. Look for the Preview button on any book detail page.",
  },
  {
    question: "How do I reset my password?",
    answer:
      'Go to the Login page and click "Forgot password?". Enter your email and we\'ll send you a reset link. The link is valid for 1 hour.',
  },
  {
    question: "What is the refund policy?",
    answer:
      "Since all our products are digital, we generally don't offer refunds after a successful download. However, if you experienced a technical issue with your purchase, contact us and we'll do our best to help.",
  },
  {
    question: "Can I read on mobile?",
    answer:
      "Yes. PDF books can be read in your mobile browser. ePub books can be downloaded and opened in any mobile reading app that supports the ePub format.",
  },
] as const;
