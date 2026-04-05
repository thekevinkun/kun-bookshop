// Import hooks we need
import { useEffect, useState } from "react";

// Import useSearchParams to read the session_id from the URL
// Stripe redirects to: /checkout/success?session_id=xxx
import { useSearchParams, useNavigate, Link } from "react-router-dom";

// Import our configured Axios instance
import api from "../../lib/api";

// Import icons
import { CheckCircle, BookOpen, Loader2 } from "lucide-react";

const CheckoutSuccessPage = () => {
  // Read query params from the URL — we need session_id to verify the payment
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();

  // Local state to track what we're showing
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    // If there's no session_id in the URL, something is wrong — redirect home
    if (!sessionId) {
      navigate("/");
      return;
    }

    // Verify the session with our backend so we know it's a real completed payment
    // We don't fulfill the order here — that's done by the webhook
    // This is just to show the user a confirmation screen
    const verifySession = async () => {
      try {
        const { data } = await api.get(
          `/checkout/verify-session?session_id=${sessionId}`,
        );
        // Store the order number to show the user
        setOrderNumber(data.orderNumber);
        setStatus("success");
      } catch {
        // Session not found or not completed — show error state
        setStatus("error");
      }
    };

    verifySession();
  }, [sessionId, navigate]);

  // --- LOADING STATE ---
  if (status === "loading") {
    return (
      <div className="container-page flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={48} className="text-teal animate-spin" />
        <p className="text-text-muted text-lg">Confirming your payment...</p>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (status === "error") {
    return (
      <div className="container-page flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-2xl font-bold text-text-light">
          Something went wrong
        </p>
        <p className="text-text-muted max-w-md">
          We couldn't confirm your payment. If you were charged, your books will
          appear in your library shortly. Please contact support if the issue
          persists.
        </p>
        <Link to="/library" className="btn-primary mt-2">
          Go to My Library
        </Link>
      </div>
    );
  }

  // --- SUCCESS STATE ---
  return (
    <div className="container-page flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      {/* Big green checkmark */}
      <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
        <CheckCircle size={48} className="text-success" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-text-light">
          Payment Successful!
        </h1>
        <p className="text-text-muted text-lg">
          Thank you for your purchase. Your books are ready to read.
        </p>
        {/* Show the order number if we got it from the backend */}
        {orderNumber && (
          <p className="text-sm text-text-muted mt-1">
            Order number:{" "}
            <span className="text-teal font-semibold">{orderNumber}</span>
          </p>
        )}
      </div>

      {/* Confirmation email notice */}
      <p className="text-sm text-text-muted max-w-sm">
        A confirmation email has been sent to you with your download links.
      </p>

      {/* CTA — send them to their library */}
      <div className="flex gap-4 mt-2">
        <Link to="/library" className="btn-primary flex items-center gap-2">
          <BookOpen size={18} />
          Go to My Library
        </Link>
        <Link to="/books" className="btn-ghost">
          Browse More Books
        </Link>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
