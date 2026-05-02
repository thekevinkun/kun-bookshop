import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";

// Import the actual IBook type so mockBook satisfies it exactly
import type { IBook } from "../../types/book";

// BookCard uses a default export
import { BookCard } from "../../components/cards";

// Build a mock book that satisfies every required field in IBook
const mockBook: IBook = {
  _id: "book-001",
  title: "The Art of Clean Code",
  // author can be a string or a populated object — we use string (the simple path)
  author: "Robert Martin",
  // authorName is the denormalized display field controllers always expose
  authorName: "Robert Martin",
  description: "A guide to writing clean, maintainable software.",
  price: 29.99,
  discountPrice: 19.99,
  coverImage: "https://res.cloudinary.com/test/image/upload/cover.jpg",
  // fileUrl is required by IBook even though BookCard doesn't render it
  fileUrl: "https://res.cloudinary.com/test/raw/upload/book.pdf",
  fileType: "pdf",
  fileSize: 5000000,
  category: ["Programming", "Software Engineering"],
  tags: ["clean code", "best practices"],
  rating: 4.5,
  reviewCount: 120,
  purchaseCount: 340,
  isActive: true,
  isFeatured: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// BookCard renders a <Link> internally so it must live inside a router
const renderBookCard = (overrides: Partial<IBook> = {}) =>
  render(
    <MemoryRouter>
      {/* Merge overrides so individual tests can change one field at a time */}
      <BookCard book={{ ...mockBook, ...overrides }} />
    </MemoryRouter>,
  );

describe("BookCard", () => {
  // Rendering
  it("renders the book title", () => {
    renderBookCard();
    expect(screen.getByText("The Art of Clean Code")).toBeInTheDocument();
  });

  it("renders the cover image with correct src", () => {
    renderBookCard();
    // BookCard renders <img alt="Cover of {title}"> — find it by role
    const img = screen.getByRole("img", {
      name: /cover of the art of clean code/i,
    });
    expect(img).toHaveAttribute("src", mockBook.coverImage);
  });

  it("renders the discounted price when discountPrice is set", () => {
    renderBookCard();
    // BookCard shows discountPrice as the main price — displayPrice = discountPrice ?? price
    expect(screen.getByText("$19.99")).toBeInTheDocument();
  });

  it("renders the original price struck-through when discountPrice is set", () => {
    renderBookCard();
    // The original price appears crossed-out alongside the discounted one
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });

  it("renders only the regular price when there is no discountPrice", () => {
    renderBookCard({ discountPrice: undefined });
    // With no discount, displayPrice = price so $29.99 is the only price shown
    expect(screen.getByText("$29.99")).toBeInTheDocument();
    // The strike-through original price element should not exist
    expect(screen.queryByText("$19.99")).not.toBeInTheDocument();
  });

  it("shows a discount percent badge when discountPrice is set", () => {
    renderBookCard();
    // discountPercent = round((29.99 - 19.99) / 29.99 * 100) = 33%
    expect(screen.getByText(/-33%/)).toBeInTheDocument();
  });

  it("does NOT show a discount badge when there is no discountPrice", () => {
    renderBookCard({ discountPrice: undefined });
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders the star rating value", () => {
    renderBookCard();
    // BookCard renders book.rating.toFixed(1) — expect "4.5"
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("renders category names when compactInfo is false (default)", () => {
    renderBookCard();
    // categories are joined with ", " and shown below the title
    expect(
      screen.getByText("Programming, Software Engineering"),
    ).toBeInTheDocument();
  });

  it("does NOT render category names when compactInfo is true", () => {
    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>,
    );
    expect(
      screen.queryByText("Programming, Software Engineering"),
    ).not.toBeInTheDocument();
  });

  // Navigation
  it("links to the correct book detail page", () => {
    renderBookCard();
    // The whole card is wrapped in a <Link to="/books/:id">
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/books/${mockBook._id}`);
  });
});
