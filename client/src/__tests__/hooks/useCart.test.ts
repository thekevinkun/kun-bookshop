import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

// There is no useCart hook — we test the Zustand store directly
import { useCartStore } from "../../store/cart";

// Minimal cart item shape matching what addItem expects
const fakeItem = {
  bookId: "book-001",
  title: "Clean Code",
  authorName: "Robert Martin",
  price: 19.99,
  coverImage: "https://example.com/cover1.jpg",
};

const fakeItem2 = {
  bookId: "book-002",
  title: "The Pragmatic Programmer",
  authorName: "David Thomas",
  price: 24.99,
  coverImage: "https://example.com/cover2.jpg",
};

describe("useCartStore", () => {
  beforeEach(() => {
    // Clear the cart before every test so state never leaks between tests
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  // Initial state
  it("starts with an empty items array", () => {
    const { result } = renderHook(() => useCartStore());
    expect(result.current.items).toHaveLength(0);
  });

  it("starts with a total of 0", () => {
    const { result } = renderHook(() => useCartStore());
    expect(result.current.total()).toBe(0);
  });

  it("starts with an itemCount of 0", () => {
    const { result } = renderHook(() => useCartStore());
    expect(result.current.itemCount()).toBe(0);
  });

  // addItem
  it("adds an item to the cart", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].bookId).toBe("book-001");
  });

  it("stores the correct title and price when an item is added", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
    });
    expect(result.current.items[0].title).toBe("Clean Code");
    expect(result.current.items[0].price).toBe(19.99);
  });

  it("does not add a duplicate when the same book is added twice", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.addItem(fakeItem); // second call should be silently ignored
    });
    expect(result.current.items).toHaveLength(1);
  });

  // removeItem
  it("removes an item from the cart by bookId", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.removeItem("book-001");
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("only removes the targeted item when multiple items are in the cart", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.addItem(fakeItem2);
      result.current.removeItem("book-001");
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].bookId).toBe("book-002");
  });

  // total
  it("calculates the correct total for a single item", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
    });
    expect(result.current.total()).toBeCloseTo(19.99);
  });

  it("calculates the correct total for multiple items", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.addItem(fakeItem2);
    });
    // 19.99 + 24.99 = 44.98
    expect(result.current.total()).toBeCloseTo(44.98);
  });

  it("recalculates total correctly after removing an item", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.addItem(fakeItem2);
      result.current.removeItem("book-001");
    });
    expect(result.current.total()).toBeCloseTo(24.99);
  });

  // itemCount
  it("returns the correct item count after adding items", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.addItem(fakeItem2);
    });
    expect(result.current.itemCount()).toBe(2);
  });

  it("returns 0 after all items are removed", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.removeItem("book-001");
    });
    expect(result.current.itemCount()).toBe(0);
  });

  // isInCart
  it("returns true for a book that is in the cart", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
    });
    expect(result.current.isInCart("book-001")).toBe(true);
  });

  it("returns false for a book that is not in the cart", () => {
    const { result } = renderHook(() => useCartStore());
    expect(result.current.isInCart("book-999")).toBe(false);
  });

  it("returns false after the item has been removed", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.removeItem("book-001");
    });
    expect(result.current.isInCart("book-001")).toBe(false);
  });

  // clearCart
  it("empties the cart and resets total to 0 when clearCart is called", () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(fakeItem);
      result.current.addItem(fakeItem2);
      result.current.clearCart();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total()).toBe(0);
  });
});
