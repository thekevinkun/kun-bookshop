import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app";
import { connectTestDB, disconnectTestDB, clearDatabase } from "../helpers/db";
import { createUser, createAdmin, createBook } from "../helpers/factories";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearDatabase();
});

// GET ALL BOOKS
describe("GET /api/books", () => {
  it("should return paginated books with default page and limit", async () => {
    // Create 3 books so there is something to return
    await createBook({ title: "Book A" });
    await createBook({ title: "Book B" });
    await createBook({ title: "Book C" });

    const res = await request(app).get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(3);
    expect(res.body.totalPages).toBeDefined();
    expect(res.body.currentPage).toBeDefined();
  });

  it("should only return isActive books", async () => {
    await createBook({ title: "Active Book", isActive: true });
    // Inactive books must be invisible to regular catalog queries
    await createBook({ title: "Inactive Book", isActive: false });

    const res = await request(app).get("/api/books");

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe("Active Book");
  });

  it("should filter by category", async () => {
    await createBook({ title: "Fiction Book", category: ["Fiction"] });
    await createBook({ title: "Science Book", category: ["Science"] });

    const res = await request(app).get("/api/books?category=Fiction");

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe("Fiction Book");
  });

  it("should sort by price ascending", async () => {
    await createBook({ title: "Cheap Book", price: 5.99 });
    await createBook({ title: "Expensive Book", price: 49.99 });

    const res = await request(app).get("/api/books?sortBy=price&sortOrder=asc");

    expect(res.status).toBe(200);
    expect(res.body.books[0].title).toBe("Cheap Book");
    expect(res.body.books[1].title).toBe("Expensive Book");
  });

  it("should respect page and limit query params", async () => {
    // Create 5 books so pagination kicks in
    for (let i = 1; i <= 5; i++) {
      await createBook({ title: `Book ${i}` });
    }

    const res = await request(app).get("/api/books?page=1&limit=3");

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(3);
    expect(res.body.totalPages).toBe(2); // 5 books / 3 per page = 2 pages
  });
});

// GET SINGLE BOOK
describe("GET /api/books/:id", () => {
  it("should return a single book by ID", async () => {
    const book = await createBook({ title: "Single Book" });

    const res = await request(app).get(`/api/books/${book._id}`);

    expect(res.status).toBe(200);
    expect(res.body.book.title).toBe("Single Book");
    // authorName must be returned as a string — never as an ObjectId ref
    expect(typeof res.body.book.authorName).toBe("string");
  });

  it("should return 404 for a non-existent book ID", async () => {
    // A valid MongoDB ObjectId that doesn't exist in the DB
    const fakeId = "64f1a2b3c4d5e6f7a8b9c0d1";

    const res = await request(app).get(`/api/books/${fakeId}`);

    expect(res.status).toBe(404);
  });

  it("should return 404 for an inactive book", async () => {
    const book = await createBook({ isActive: false });

    const res = await request(app).get(`/api/books/${book._id}`);

    expect(res.status).toBe(404);
  });
});

// GET CATEGORIES
describe("GET /api/books/categories", () => {
  it("should return a unique list of categories from active books", async () => {
    await createBook({ category: ["Fiction", "Drama"] });
    await createBook({ category: ["Fiction", "Thriller"] });
    await createBook({ category: ["Science"] });

    const res = await request(app).get("/api/books/categories");

    expect(res.status).toBe(200);
    expect(res.body.categories).toContain("Fiction");
    expect(res.body.categories).toContain("Drama");
    expect(res.body.categories).toContain("Thriller");
    expect(res.body.categories).toContain("Science");
    // Fiction appears in two books but must only appear once in the list
    const fictionCount = res.body.categories.filter(
      (c: string) => c === "Fiction",
    ).length;
    expect(fictionCount).toBe(1);
  });
});

// GET FEATURED
describe("GET /api/books/featured", () => {
  it("should return up to 5 books sorted by scoring algorithm", async () => {
    // High score: high purchaseCount
    await createBook({ title: "Bestseller", purchaseCount: 100, rating: 4.8 });
    // Low score: no purchases
    await createBook({ title: "Unknown", purchaseCount: 0, rating: 3.0 });

    const res = await request(app).get("/api/books/featured");

    expect(res.status).toBe(200);
    expect(res.body.books.length).toBeLessThanOrEqual(5);
    // Bestseller must come first — it has a much higher score
    expect(res.body.books[0].title).toBe("Bestseller");
  });
});

// SEARCH AUTOCOMPLETE
describe("GET /api/books/search/autocomplete", () => {
  it("should return matching books for a query string", async () => {
    await createBook({ title: "The Great Gatsby" });
    await createBook({ title: "Great Expectations" });
    await createBook({ title: "Moby Dick" });

    const res = await request(app).get(
      "/api/books/search/autocomplete?q=Great",
    );

    expect(res.status).toBe(200);
    // Autocomplete returns { suggestions } — not { books }
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it("should return empty array when no books match", async () => {
    await createBook({ title: "Moby Dick" });

    const res = await request(app).get(
      "/api/books/search/autocomplete?q=zzznomatch",
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBe(0);
  });
});

// GET RECOMMENDATIONS
describe("GET /api/books/recommendations", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get("/api/books/recommendations");
    expect(res.status).toBe(401);
  });

  it("should return up to 10 books for an authenticated user", async () => {
    const { token } = await createUser();
    // Create some books for the fallback path (user has no library/wishlist)
    for (let i = 0; i < 5; i++) {
      await createBook({
        title: `Book ${i}`,
        purchaseCount: i * 2,
        rating: 4.0,
      });
    }

    const res = await request(app)
      .get("/api/books/recommendations")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.books).toBeDefined();
    expect(res.body.books.length).toBeLessThanOrEqual(10);
    // personalised flag must be present — tells the frontend which label to show
    expect(typeof res.body.personalised).toBe("boolean");
  });
});

// GET BOOK PREVIEW
describe("GET /api/books/:id/preview", () => {
  it("should return 404 for a non-existent book", async () => {
    const fakeId = "64f1a2b3c4d5e6f7a8b9c0d1";
    const res = await request(app).get(`/api/books/${fakeId}/preview`);
    expect(res.status).toBe(404);
  });

  it("should return 400 when book has no file uploaded yet", async () => {
    // Book exists but filePublicId is missing — no file has been uploaded
    const book = await createBook({ filePublicId: "" });

    const res = await request(app).get(`/api/books/${book._id}/preview`);

    expect(res.status).toBe(400);
  });
});

// ADMIN — CREATE BOOK
describe("POST /api/books (admin)", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/books")
      .send({ title: "New Book" });
    expect(res.status).toBe(401);
  });

  it("should return 403 when authenticated as a regular user", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post("/api/books")
      .set("Cookie", `token=${token}`)
      .send({ title: "New Book" });

    expect(res.status).toBe(403);
  });
});

// ADMIN — UPDATE BOOK
describe("PUT /api/books/:id (admin)", () => {
  it("should return 403 when authenticated as a regular user", async () => {
    const { token } = await createUser();
    const book = await createBook();

    const res = await request(app)
      .put(`/api/books/${book._id}`)
      .set("Cookie", `token=${token}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(403);
  });

  it("should return 404 when admin tries to update non-existent book", async () => {
    const { token } = await createAdmin();
    const fakeId = "64f1a2b3c4d5e6f7a8b9c0d1";

    const res = await request(app)
      .put(`/api/books/${fakeId}`)
      .set("Cookie", `token=${token}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(404);
  });
});

// ADMIN — DELETE BOOK
describe("DELETE /api/books/:id (admin)", () => {
  it("should soft-delete (deactivate) a book when called by admin", async () => {
    const { token } = await createAdmin();
    const book = await createBook({ title: "To Be Deleted" });

    const res = await request(app)
      .delete(`/api/books/${book._id}`)
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);

    // Verify the book is now inactive in the database — soft delete, not hard delete
    const { Book } = await import("../../models/Book");
    const updatedBook = await Book.findById(book._id);
    expect(updatedBook!.isActive).toBe(false);
  });

  it("should return 403 when called by a regular user", async () => {
    const { token } = await createUser();
    const book = await createBook();

    const res = await request(app)
      .delete(`/api/books/${book._id}`)
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(403);
  });
});
