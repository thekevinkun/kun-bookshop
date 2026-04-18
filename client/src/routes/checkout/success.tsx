import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, BookOpen, Loader2 } from "lucide-react";
import { useCartStore } from "../../store/cart";
import SEO from "../../components/common/SEO";
import api from "../../lib/api";

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // We need to clear the cart on this page after confirming payment
  // We do this here instead of the success page because we want to be sure
  // the payment went through before clearing the cart
  const clearCart = useCartStore((state) => state.clearCart);

  // Track how many times we've polled — give up after 10 attempts (20 seconds)
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }

    const verify = async () => {
      try {
        const { data, status: httpStatus } = await api.get(
          `/checkout/verify-session?session_id=${sessionId}`,
          // We handle 202 and 400 ourselves — don't let Axios throw on them
          { validateStatus: (s) => s < 500 },
        );

        if (httpStatus === 200 && data.status === "completed") {
          // Webhook has fired and order is fulfilled — show success
          clearCart();
          setOrderNumber(data.orderNumber);
          setStatus("success");
          return;
        }

        if (httpStatus === 202 && data.status === "pending") {
          // Webhook hasn't fired yet — poll again in 2 seconds (max 10 times)
          pollCount.current += 1;
          if (pollCount.current >= 10) {
            // Gave up after 20 seconds — something is wrong on our end
            setStatus("error");
            return;
          }
          // Schedule next poll
          pollTimer.current = setTimeout(verify, 2000);
          return;
        }

        // Any other response (failed payment, not found, etc.) — show error
        setStatus("error");
      } catch {
        setStatus("error");
      }
    };

    verify();

    // Clean up any pending poll timer when the component unmounts
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [sessionId, navigate]);

  // LOADING STATE
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center flex flex-col items-center gap-6">
          <Loader2 size={48} className="text-golden animate-spin" />
          <p className="text-text-muted text-lg">Confirming your payment...</p>
          <p className="text-text-muted text-sm">
            This usually takes just a few seconds.
          </p>
        </div>
      </main>
    );
  }

  // ERROR STATE
  if (status === "error") {
    return (
      <>
        <SEO
          title="Order Confirmed"
          description="Your order has been successfully placed. You can now access your purchased books in Kun Bookshop."
          url="/checkout/success"
          noIndex={true}
        />

        <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
            <p className="text-5xl mb-2">❌</p>
            <p className="text-2xl font-bold text-text-light">
              Something went wrong
            </p>
            <p className="text-text-muted">
              We couldn't confirm your payment. If you were charged, your books
              will appear in your library shortly. Contact support if the issue
              persists.
            </p>
            <Link
              to="/library"
              className="btn-primary max-w-sm w-full flex items-center gap-2"
            >
              <BookOpen size={18} />
              Go to My Library
            </Link>
          </div>
        </main>
      </>
    );
  }

  // SUCCESS STATE
  return (
    <>
      <SEO
        title="Order Confirmed"
        description="Your order has been successfully placed. You can now access your purchased books in Kun Bookshop."
        url="/checkout/success"
        noIndex={true}
      />

      <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center flex flex-col items-center gap-6">
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
            {orderNumber && (
              <p className="text-sm text-text-muted mt-1">
                Order number:{" "}
                <span className="text-golden font-semibold">{orderNumber}</span>
              </p>
            )}
          </div>
          <p className="text-sm text-text-muted max-w-sm">
            A confirmation email has been sent to you with your download links.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <Link
              to="/library"
              className="btn-primary w-full sm:w-fit flex items-center gap-2"
            >
              <BookOpen size={18} />
              Go to My Library
            </Link>
            <Link to="/books" className="btn-ghost w-full sm:w-fit">
              Browse More Books
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
