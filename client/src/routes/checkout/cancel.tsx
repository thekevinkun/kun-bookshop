import { useEffect } from "react";

// Import Link for navigation between pages
import { Link, useSearchParams, useNavigate } from "react-router-dom";

// Import icons — ArrowLeft for back to browsing, Home for homepage
import { XCircle, ArrowLeft, Home } from "lucide-react";

// Import cart store so we can tell the user their cart is still waiting
import { useCartStore } from "../../store/cart";

import SEO from "../../components/common/SEO";

export default function CheckoutCancelPage() {
  const [searchParams] = useSearchParams(); // Read URL query params
  const sessionId = searchParams.get("session_id"); // Stripe appends this to the cancel URL
  const navigate = useNavigate();

  // Read itemCount to reassure the user their cart is still intact
  const { itemCount } = useCartStore();

  // Count how many items are sitting in the cart right now
  const count = itemCount();

  useEffect(() => {
    // If there's no session_id, this page was visited directly — kick them out
    // Legitimate cancels always come from Stripe which always includes session_id
    if (!sessionId) {
      navigate("/");
    }
  }, [sessionId, navigate]);

  // Don't render anything while the redirect is in progress
  if (!sessionId) return null;

  return (
    <>
      <SEO
        title="Payment Cancelled"
        description="Your payment was not completed. You can try again anytime to purchase your books in Kun Bookshop."
        url="/checkout/cancel"
        noIndex={true}
      />

      {/* Full-height centered layout — mirrors the success page structure */}
      <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center flex flex-col items-center gap-6">
          {/* Red X icon — same size/shape as the success page's green circle */}
          <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center">
            <XCircle size={48} className="text-error" />
          </div>

          {/* Heading + subtext block */}
          <div className="flex flex-col gap-2">
            <h1 className="text-text-light">Payment Cancelled</h1>
            <p className="text-text-muted text-lg">
              No worries — you haven't been charged.
            </p>

            {/* Only show if they still have items in cart — reassures them nothing was lost */}
            {count > 0 && (
              <p className="text-sm text-golden mt-1">
                Your {count} {count === 1 ? "book" : "books"} are still in your
                cart whenever you're ready.
              </p>
            )}
          </div>

          {/* Small hint about what they can do next */}
          <p className="text-sm text-text-muted max-w-sm">
            You can go back and try again, or continue browsing. Your cart will
            be waiting.
          </p>

          {/* Action buttons — primary is the most useful next action (back to books) */}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {/* Primary — send them back to where they came from */}
            <Link
              to="/books"
              className="btn-primary w-full sm:w-fit flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Books
            </Link>

            {/* Secondary — homepage if they want a fresh start */}
            <Link
              to="/"
              className="btn-ghost w-full sm:w-fit flex items-center gap-2"
            >
              <Home size={18} />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
