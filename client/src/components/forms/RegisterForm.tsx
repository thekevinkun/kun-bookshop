import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2 } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../validators/auth.validator";
import type { RegisterInput } from "../../validators/auth.validator";

import api from "../../lib/api";

// We don't log the user in after register — they need to verify their email first
// So this form just shows a success message after submission
const RegisterForm = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      // POST /api/auth/register — creates the account and sends verification email
      await api.post("/auth/register", data);

      // Redirect to login with a success message in the URL state
      // The login page can read this and show a "check your email" notice
      navigate("/login", {
        state: {
          message:
            "Account created! Please check your email to verify your account.",
        },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Registration failed. Please try again.";

      // If the email is already taken, show the error on the email field specifically
      if (message.toLowerCase().includes("email")) {
        setError("email", { message });
      } else {
        // Otherwise show it on the root level (general form error)
        setError("root", { message });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* GENERAL FORM ERROR — shown if the error isn't field-specific */}
      {errors.root && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30">
          <p className="text-sm text-error">{errors.root.message}</p>
        </div>
      )}

      {/* FIRST NAME + LAST NAME — side by side on larger screens */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-text-light"
          >
            First name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="firstName"
              type="text"
              placeholder="John"
              {...register("firstName")}
              className="input-field pl-10"
            />
          </div>
          {errors.firstName && (
            <p className="text-sm text-error">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-text-light"
          >
            Last name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              id="lastName"
              type="text"
              placeholder="Doe"
              {...register("lastName")}
              className="input-field pl-10"
            />
          </div>
          {errors.lastName && (
            <p className="text-sm text-error">{errors.lastName.message}</p>
          )}
        </div>
      </div>

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

      {/* PASSWORD FIELD */}
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text-light"
        >
          Password
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
          <p className="text-sm text-error">{errors.password.message}</p>
        )}
      </div>

      {/* CONFIRM PASSWORD FIELD */}
      <div className="space-y-1">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-text-light"
        >
          Confirm password
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
          <p className="text-sm text-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full btn-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </button>
    </form>
  );
};

export default RegisterForm;
