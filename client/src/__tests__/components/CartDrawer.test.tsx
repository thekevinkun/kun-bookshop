import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { CartDrawer } from "../../components/features";

// Mock Zustand stores
// CartDrawer reads items, removeItem, total, itemCount from useCartStore
// and isAuthenticated from useAuthStore — we must control these in tests

// Define the cart items shape the store returns
const mockItems = [
  {
    bookId: "book-001",
    title: "Clean Code",
    author: "Robert Martin",
    price: 19.99,
    coverImage: "https://example.com/cover1.jpg",
  },
  {
    bookId: "book-002",
    title: "The Pragmatic Programmer",
    author: "David Thomas",
    price: 24.99,
    coverImage: "https://example.com/cover2.jpg",
  },
];

// Spy we can use to assert removeItem was called with the right bookId
const removeItemSpy = vi.fn();

// Default cart store mock — 2 items in the cart, authenticated user
const makeCartStore = (overrides = {}) => ({
  items: mockItems,
  removeItem: removeItemSpy,
  total: () => 44.98, // 19.99 + 24.99
  itemCount: () => 2,
  ...overrides,
});

vi.mock("@/store/cart", () => ({
  useCartStore: vi.fn(() => makeCartStore()),
}));

vi.mock("@/store/auth", () => ({
  useAuthStore: vi.fn(() => ({ isAuthenticated: true })),
}));

// CouponInput is rendered inside CartDrawer — mock it to keep these tests focused
// on CartDrawer's own behaviour, not CouponInput's
vi.mock("@/components/features/CouponInput", () => ({
  CouponInput: () => <div data-testid="coupon-input-mock" />,
}));

// Import the mocked stores so individual tests can override their return values
import { useCartStore } from "../../store/cart";
import { useAuthStore } from "../../store/auth";

// CartDrawer only takes isOpen and onClose — everything else comes from Zustand
const renderCartDrawer = (
  props: { isOpen?: boolean; onClose?: () => void } = {},
) =>
  render(
    <MemoryRouter>
      <CartDrawer
        isOpen={props.isOpen ?? true}
        onClose={props.onClose ?? vi.fn()}
      />
    </MemoryRouter>,
  );

describe("CartDrawer", () => {
  beforeEach(() => {
    // Reset store mocks back to default state before each test
    vi.mocked(useCartStore).mockReturnValue(
      makeCartStore() as ReturnType<typeof useCartStore>,
    );
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
    } as ReturnType<typeof useAuthStore>);
    removeItemSpy.mockClear();
  });

  // Visibility
  it("renders cart items when isOpen is true", () => {
    renderCartDrawer({ isOpen: true });
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(screen.getByText("The Pragmatic Programmer")).toBeInTheDocument();
  });

  it("does not render content when isOpen is false", () => {
    renderCartDrawer({ isOpen: false });
    // Radix Dialog.Content is not mounted when open=false
    expect(screen.queryByText("Clean Code")).not.toBeInTheDocument();
  });

  // Item rendering
  it("renders author names for each item", () => {
    renderCartDrawer();
    expect(screen.getByText("Robert Martin")).toBeInTheDocument();
    expect(screen.getByText("David Thomas")).toBeInTheDocument();
  });

  it("renders the price for each item", () => {
    renderCartDrawer();
    expect(screen.getByText("$19.99")).toBeInTheDocument();
    expect(screen.getByText("$24.99")).toBeInTheDocument();
  });

  it("renders the correct total", () => {
    renderCartDrawer();
    // total() returns 44.98 — shown in the footer as $44.98
    expect(screen.getByText("$44.98")).toBeInTheDocument();
  });

  it("shows the item count badge in the header", () => {
    renderCartDrawer();
    // itemCount() returns 2 — shown as a golden badge next to "Cart"
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  // Empty state
  it("shows the empty cart message when items array is empty", () => {
    vi.mocked(useCartStore).mockReturnValue(
      makeCartStore({
        items: [],
        total: () => 0,
        itemCount: () => 0,
      }) as ReturnType<typeof useCartStore>,
    );
    renderCartDrawer();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("does not show the footer (total + checkout) when cart is empty", () => {
    vi.mocked(useCartStore).mockReturnValue(
      makeCartStore({
        items: [],
        total: () => 0,
        itemCount: () => 0,
      }) as ReturnType<typeof useCartStore>,
    );
    renderCartDrawer();
    // The checkout button only renders when items.length > 0
    expect(
      screen.queryByRole("button", { name: /checkout/i }),
    ).not.toBeInTheDocument();
  });

  // Actions
  it("calls onClose when the close button is clicked", async () => {
    const handleClose = vi.fn();
    renderCartDrawer({ onClose: handleClose });
    const user = userEvent.setup();
    // aria-label="Close cart" on the × button in the header
    await user.click(screen.getByRole("button", { name: /close cart/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls removeItem with the correct bookId when the trash button is clicked", async () => {
    renderCartDrawer();
    const user = userEvent.setup();
    // aria-label="Remove {title} from cart" — target the first book's button
    await user.click(
      screen.getByRole("button", { name: /remove clean code from cart/i }),
    );
    expect(removeItemSpy).toHaveBeenCalledWith("book-001");
  });

  it("renders the Checkout button when the cart has items", () => {
    renderCartDrawer();
    expect(
      screen.getByRole("button", { name: /checkout/i }),
    ).toBeInTheDocument();
  });
});
