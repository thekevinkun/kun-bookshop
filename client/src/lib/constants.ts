export const FOOTER_NAV_LINKS = [
  { label: "Browse Books", to: "/books" },
  { label: "New Arrivals", to: "/books?sortBy=createdAt" },
  { label: "Top Rated", to: "/books?sortBy=rating" },
  { label: "Featured", to: "/books?sortBy=purchaseCount" },
  { label: "My Library", to: "/library" },
  { label: "Privacy Policy", to: "#" },
] as const;

export const FOOTER_SOCIAL_LINKS = [
  { label: "Twitter", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "GitHub", href: "#" },
] as const;

export const FOOTER_CONTACT = {
  email: "hello@kunbookshop.com",
  availability: "Available worldwide",
  supportText: "Digital books, instant delivery, secure checkout.",
} as const;
