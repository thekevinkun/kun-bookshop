import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// useBooks wraps React Query's useQuery to fetch books from the backend
import { useBooks } from "../../hooks/useBooks";

// Mock the api module — useBooks calls api.get('/books') internally
vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "../../lib/api";

// Build a minimal paginated books response matching the backend shape
const fakeBooksResponse = {
  books: [
    {
      _id: "book-001",
      title: "Clean Code",
      authorName: "Robert Martin",
      price: 19.99,
      coverImage: "https://example.com/cover1.jpg",
      rating: 4.5,
      isFeatured: false,
      isActive: true,
      category: ["Programming"],
      tags: [],
      reviewCount: 50,
      purchaseCount: 200,
    },
    {
      _id: "book-002",
      title: "The Pragmatic Programmer",
      authorName: "David Thomas",
      price: 24.99,
      coverImage: "https://example.com/cover2.jpg",
      rating: 4.8,
      isFeatured: true,
      isActive: true,
      category: ["Programming"],
      tags: [],
      reviewCount: 80,
      purchaseCount: 350,
    },
  ],
  total: 2,
  totalPages: 1,
  currentPage: 1,
};

// Every hook test needs its own QueryClient so cache doesn't leak between tests
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests — we want failures to surface immediately
        retry: false,
      },
    },
  });
  // Return a wrapper component that provides the QueryClient to the hook
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useBooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Loading state
  it("starts in a loading state before the request completes", () => {
    // Return a promise that never resolves — keeps the hook in loading state
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    // isLoading is true while the first fetch is in-flight
    expect(result.current.isLoading).toBe(true);
  });

  // Successful fetch
  it("returns books after a successful fetch", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fakeBooksResponse });

    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    // waitFor polls until the assertion passes — handles async state updates
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.books).toHaveLength(2);
    expect(result.current.data?.books[0].title).toBe("Clean Code");
  });

  it("calls api.get with the correct default endpoint", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fakeBooksResponse });

    renderHook(() => useBooks(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining("/books"));
    });
  });

  it("returns pagination metadata alongside the books array", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fakeBooksResponse });

    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.totalPages).toBe(1);
    expect(result.current.data?.total).toBe(2);
    expect(result.current.data?.currentPage).toBe(1);
  });

  // Filters
  it("passes category filter as a query param when provided", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fakeBooksResponse });

    renderHook(() => useBooks({ category: "Programming" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("category=Programming"),
      );
    });
  });

  it("passes category bucket as a query param when provided", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fakeBooksResponse });

    renderHook(() => useBooks({ categoryBucket: "mystery-crime" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("categoryBucket=mystery-crime"),
      );
    });
  });

  it("passes search term as a query param when provided", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fakeBooksResponse });

    renderHook(() => useBooks({ search: "clean" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("search=clean"),
      );
    });
  });

  it("passes page number as a query param when provided", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: fakeBooksResponse });

    renderHook(() => useBooks({ page: 2 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining("page=2"));
    });
  });

  // Error state
  it("sets isError to true when the api call fails", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
