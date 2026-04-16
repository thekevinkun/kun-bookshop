// Import Link and useNavigate for navigation
import { Link } from "react-router-dom";

// Import icons
import { XCircle, ShoppingCart, ArrowLeft } from "lucide-react";

// Import cart store so we can reopen the cart drawer
import { useCartStore } from "../../store/cart";

import SEO from "../../components/common/SEO";

export default function CheckoutCancelPage() {
  // Read itemCount to tell the user their cart is still intact
  const { itemCount } = useCartStore();

  return (
    <>
      <SEO
        title="Payment Cancelled"
        description="Your payment was not completed. You can try again anytime to purchase your books in Kun Bookshop."
        url="/checkout/cancel"
        noIndex={true}
      />

      <div className="container-page flex flex-col items-center justify-center min-h-[90vh] gap-6 text-center">
        {/* Red X icon */}
        <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center">
          <XCircle size={48} className="text-error" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-text-light">
            Payment Cancelled
          </h1>
          <p className="text-text-muted text-lg">
            No worries — you haven't been charged.
          </p>
          {/* Reassure them their cart is still there */}
          {itemCount() > 0 && (
            <p className="text-sm text-golden mt-1">
              Your {itemCount()} {itemCount() === 1 ? "book" : "books"} are
              still in your cart whenever you're ready.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-2">
          {/* Go back to browsing */}
          <Link to="/books" className="btn-primary flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Books
          </Link>
          {/* Go back to home */}
          <Link to="/" className="btn-ghost flex items-center gap-2">
            <ShoppingCart size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
