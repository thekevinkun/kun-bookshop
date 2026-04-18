import { useState } from "react";
import { useForm } from "react-hook-form";
// useParams lets us read the :token segment from the URL
import { useParams, useNavigate } from "react-router-dom";

import { Lock, Loader2, CheckCircle } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";

import { resetPasswordSchema } from "../../validators/auth.validator";
import type { ResetPasswordInput } from "../../validators/auth.validator";

import SEO from "../../components/common/SEO";

import api from "../../lib/api";

export default function ResetPasswordPage() {
  // Read the reset token from the URL — e.g. /reset-password/abc123...
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      // POST /api/auth/reset-password/:token — sends the new password with the URL token
      await api.post(`/auth/reset-password/${token}`, data);
      setIsSuccess(true);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Something went wrong. Please try again.";
      setError("root", { message });
    }
  };

  // Success state — show confirmation and redirect to login after a moment
  if (isSuccess) {
    return (
      <>
        <SEO
          title="Reset Password"
          description="Set a new password to securely regain access to your Kun Bookshop account."
          url="/reset-password"
          noIndex={true}
        />

        <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="card-base text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-success mx-auto" />
              <h3 className="text-xl font-semibold text-text-light">
                Password reset!
              </h3>
              <p className="text-text-muted">
                Your password has been changed successfully. You can now sign in
                with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="btn-primary w-full"
              >
                Go to sign in
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Reset Password"
        description="Set a new password to securely regain access to your Kun Bookshop account."
        url="/reset-password"
        noIndex={true}
      />

      <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <img
                src="/images/logo.webp"
                alt="Logo"
                className="w-12 h-12 sm:w-14 sm:h-14 object-cover"
              />
              <span className="text-text-light text-gradient font-cinzel font-medium text-3xl sm:text-4xl">
                un <span className="text-golden">Bookshop</span>
              </span>
            </div>

            <h1 className="text-text-muted !text-sm sm:!text-base !font-normal text-center mt-2">
              Set your new password
            </h1>
          </div>

          <div className="card-base">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {errors.root && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/30">
                  <p className="text-sm text-error">{errors.root.message}</p>
                </div>
              )}

              {/* NEW PASSWORD FIELD */}
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-light"
                >
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    {...register("password")}
                    className="input-field pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-error">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* CONFIRM NEW PASSWORD FIELD */}
              <div className="space-y-1">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-light"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className="input-field pl-10"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-error">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full btn-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
