import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../lib/api";

type VerificationStatus = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [message, setMessage] = useState("Verifying your email...");
  const hasAttemptedVerification = useRef(false);

  useEffect(() => {
    if (hasAttemptedVerification.current) {
      return;
    }

    hasAttemptedVerification.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(
          response.data.message ||
            "Email verified successfully. You can now sign in.",
        );
      } catch (error: unknown) {
        const errorMessage =
          (error as { response?: { data?: { error?: string } } }).response?.data
            ?.error ||
          "We could not verify your email. Please request a new link.";

        setStatus("error");
        setMessage(errorMessage);
      }
    };

    void verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">📚 Kun Bookshop</h1>
          <p className="text-text-muted mt-2">Email verification</p>
        </div>

        <div className="card-base text-center space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              status === "success"
                ? "bg-success/10 border-success/30"
                : status === "error"
                  ? "bg-error/10 border-error/30"
                  : "bg-white/5 border-white/10"
            }`}
          >
            <p
              className={`text-sm ${
                status === "success"
                  ? "text-success"
                  : status === "error"
                    ? "text-error"
                    : "text-text-light"
              }`}
            >
              {message}
            </p>
          </div>

          <Link
            to="/login"
            className="btn-primary inline-flex w-full justify-center"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
