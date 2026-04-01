import { useState } from "react";
import { useForm } from "react-hook-form";

import { Mail, Loader2, CheckCircle } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../../validators/auth.validator";
import type { ForgotPasswordInput } from "../../validators/auth.validator";

import api from "../../lib/api";

const ForgotPasswordForm = () => {
  // Track whether the form was successfully submitted
  // After success we show a confirmation message instead of the form
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      // POST /api/auth/forgot-password — always returns 200 regardless of whether email exists
      // This is intentional on the backend to prevent email enumeration
      await api.post("/auth/forgot-password", data);

      // Show the success state — same message whether email exists or not
      setIsSuccess(true);
    } catch (error: any) {
      setError("root", {
        message:
          error.response?.data?.error ||
          "Something went wrong. Please try again.",
      });
    }
  };

  // Success state — replace the form with a confirmation message
  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        {/* Green checkmark icon to visually confirm success */}
        <CheckCircle className="w-16 h-16 text-success mx-auto" />
        <h3 className="text-xl font-semibold text-text-light">
          Check your email
        </h3>
        <p className="text-text-muted">
          If an account with that email exists, we've sent a password reset
          link. It expires in 1 hour.
        </p>
        <a href="/login" className="btn-primary inline-flex mt-4">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {errors.root && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-sm text-error">{errors.root.message}</p>
        </div>
      )}

      <p className="text-text-muted text-sm">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

      {/* EMAIL FIELD */}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-light"
        >
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            className="input-field pl-10"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-error">{errors.email.message}</p>
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
            Sending link...
          </>
        ) : (
          "Send reset link"
        )}
      </button>

      <div className="text-center">
        <a href="/login" className="text-sm text-teal hover:underline">
          Back to sign in
        </a>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
