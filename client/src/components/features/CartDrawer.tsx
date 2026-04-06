// Import React hooks we need
import { useState } from "react";

// Import React Router's navigation hook
import { useNavigate, Link } from "react-router-dom";

// Import Radix Dialog — we use this as our slide-in drawer (same as Phase 3 pattern)
import * as Dialog from "@radix-ui/react-dialog";

// Import icons from lucide-react
import { X, ShoppingCart, Trash2, ShoppingBag } from "lucide-react";

// Import our cart store to read items and call actions
import { useCartStore } from "../../store/cart";

// Import auth store to check if user is logged in before checkout
import { useAuthStore } from "../../store/auth";

// Import our configured Axios instance to call the backend
import api from "../../lib/api";

// CartDrawer is the slide-in panel that shows when the user clicks the cart icon
// It accepts isOpen and onClose so the parent (Navbar) controls when it shows
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  // Read cart state and actions from our Zustand store
  const { items, removeItem, total, itemCount } = useCartStore();
  // Read auth state — we need to know if user is logged in before checkout
  const { isAuthenticated } = useAuthStore();
  // Local loading state — shows spinner while Stripe session is being created
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  // Local error state — shows an error message if checkout fails
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const navigate = useNavigate();

  const clearCheckoutState = () => {
    setCheckoutError(null);
    setIsCheckingOut(false);
  };

  const handleRemoveItem = (bookId: string) => {
    clearCheckoutState();
    removeItem(bookId);
  };

  const handleBrowseBooks = () => {
    clearCheckoutState();
    onClose();
  };

  // Called when the user clicks "Checkout"
  const handleCheckout = async () => {
    // If not logged in, close the drawer and send them to login
    if (!isAuthenticated) {
      clearCheckoutState();
      onClose();
      navigate("/login");
      return;
    }

    // Clear any previous error before trying again
    setCheckoutError(null);
    setIsCheckingOut(true);

    try {
      const { data } = await api.post("/checkout/create-session", {
        items: items.map((item) => ({ bookId: item.bookId })),
      });

      // DO NOT clearCart() here — the user hasn't paid yet
      // The cart is cleared by the success page AFTER we confirm payment
      // If the user cancels on Stripe or the redirect fails, their cart is still intact

      // Redirect the user to Stripe's hosted checkout page
      window.location.href = data.url;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Checkout failed. Please try again.";
      setCheckoutError(message);
      setIsCheckingOut(false);
    }
  };

  return (
    // Radix Dialog.Root controls open/close state
    // onOpenChange fires when user presses Escape or clicks the overlay
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          clearCheckoutState();
          onClose();
        }
      }}
    >
      {/* Portal renders outside the DOM tree so z-index issues are impossible */}
      <Dialog.Portal>
        {/* Dark overlay behind the drawer */}
        <Dialog.Overlay
          className="cart-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />

        {/* The drawer panel itself — slides in from the right */}
        <Dialog.Content
          className="cart-drawer fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
          style={{ borderLeft: "1px solid rgba(51,65,85,0.5)" }}
        >
          {/* --- HEADER --- */}
          <div
            className="flex items-center justify-between p-6"
            style={{ borderBottom: "1px solid rgba(51,65,85,0.5)" }}
          >
            <Dialog.Title className="flex items-center gap-2 text-xl font-bold text-text-light">
              {/* Cart icon with item count badge */}
              <ShoppingCart size={22} className="text-teal" />
              Cart
              {/* Only show the badge if there's something in the cart */}
              {itemCount() > 0 && (
                <span className="bg-teal text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {itemCount()}
                </span>
              )}
            </Dialog.Title>

            {/* Close button — top right corner */}
            <Dialog.Close asChild>
              <button
                className="text-text-muted hover:text-text-light transition-colors"
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </Dialog.Close>
          </div>

          {/* --- BODY --- */}
          {/* flex-1 makes this section grow to fill available space */}
          {/* overflow-y-auto adds a scrollbar if there are many items */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Empty state — shown when the cart has no items */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
                <ShoppingBag size={56} strokeWidth={1} />
                <p className="text-lg font-medium">Your cart is empty</p>
                <p className="text-sm text-center">
                  Browse our collection and add some books!
                </p>
                {/* Close the drawer and let them keep browsing */}
                <Link
                  to="/books"
                  onClick={handleBrowseBooks}
                  className="btn-primary mt-2"
                >
                  Browse Books
                </Link>
              </div>
            ) : (
              // List of cart items
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li
                    key={item.bookId}
                    className="flex gap-4 items-start"
                    style={{
                      paddingBottom: "1rem",
                      borderBottom: "1px solid rgba(51,65,85,0.4)",
                    }}
                  >
                    {/* Book cover thumbnail */}
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-14 h-20 object-cover rounded-md flex-shrink-0"
                    />

                    {/* Book info */}
                    <div className="flex-1 min-w-0">
                      {/* min-w-0 prevents text from overflowing the flex container */}
                      <p className="font-semibold text-text-light truncate">
                        {item.title}
                      </p>
                      <p className="text-sm text-text-muted truncate">
                        {item.author}
                      </p>
                      <p className="text-teal font-bold mt-1">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveItem(item.bookId)}
                      className="text-text-muted hover:text-error transition-colors flex-shrink-0 mt-1"
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- FOOTER (only shown when cart has items) --- */}
          {items.length > 0 && (
            <div
              className="p-6 flex flex-col gap-4"
              style={{ borderTop: "1px solid rgba(51,65,85,0.5)" }}
            >
              {/* Order summary */}
              <div className="flex justify-between items-center text-text-light">
                <span className="text-text-muted">
                  {itemCount()} {itemCount() === 1 ? "book" : "books"}
                </span>
                <span className="text-xl font-bold">${total().toFixed(2)}</span>
              </div>

              {/* Error message from failed checkout attempt */}
              {checkoutError && (
                <p className="text-error text-sm text-center">
                  {checkoutError}
                </p>
              )}

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="btn-primary w-full"
              >
                {isCheckingOut ? (
                  // Show spinner while waiting for Stripe session to be created
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Redirecting to Stripe...
                  </span>
                ) : (
                  "Checkout"
                )}
              </button>

              {/* Reassure the user their payment is handled by Stripe */}
              <p className="text-xs text-text-muted text-center">
                Secure checkout powered by Stripe
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CartDrawer;
