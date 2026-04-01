// Import React Hook Form for form state management and validation
import { useForm } from "react-hook-form";

// Import useNavigate to redirect after successful login
import { useNavigate } from "react-router-dom";

// Import lucide icons for the email and password fields
import { Mail, Lock, Loader2 } from "lucide-react";

// Import zodResolver — bridges React Hook Form and Zod so they work together
import { zodResolver } from "@hookform/resolvers/zod";

// Import our Zod schema and inferred type for login
import { loginSchema } from "../../validators/auth.validator";
import type { LoginInput } from "../../validators/auth.validator";

// Import our configured Axios instance — never use plain axios
import api from "../../lib/api";

// Import our Zustand auth store to save the user after login
import { useAuthStore } from "../../store/auth";

const LoginForm = () => {
  // Get the login action from our Zustand store
  const { login } = useAuthStore();

  // useNavigate lets us redirect programmatically after login
  const navigate = useNavigate();

  // Set up React Hook Form with Zod validation
  // register: connects inputs to the form, handleSubmit: wraps our submit handler,
  // formState: gives us errors and loading state
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError, // Lets us set server-side errors on specific fields
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema), // Zod handles all validation rules
  });

  // Called when the form passes validation and is submitted
  const onSubmit = async (data: LoginInput) => {
    try {
      // POST /api/auth/login — sends email and password, gets back user + token
      const response = await api.post("/auth/login", data);

      // Save the user and token to the Zustand store (also persisted to localStorage)
      login(response.data.user, response.data.token);

      // Redirect to the home page after successful login
      navigate("/");
    } catch (error: any) {
      // The server returned an error — show it on the form
      const message =
        error.response?.data?.error || "Login failed. Please try again.";

      // Attach the error to the password field (most login errors relate to credentials)
      setError("password", { message });
    }
  };

  return (
    // The form element — handleSubmit runs Zod validation before calling onSubmit
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* EMAIL FIELD */}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-light"
        >
          Email address
        </label>
        <div className="relative">
          {/* Icon positioned absolutely inside the input wrapper */}
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            // register() connects this input to React Hook Form
            {...register("email")}
            className="input-field pl-10" // pl-10 leaves room for the icon
          />
        </div>
        {/* Show Zod validation error if email is invalid */}
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
            placeholder="••••••••"
            {...register("password")}
            className="input-field pl-10"
          />
        </div>
        {/* Shows either a Zod error OR a server error (like 'Invalid credentials') */}
        {errors.password && (
          <p className="text-sm text-error">{errors.password.message}</p>
        )}
      </div>

      {/* FORGOT PASSWORD LINK */}
      <div className="text-right">
        <a
          href="/forgot-password"
          className="text-sm text-teal hover:underline"
        >
          Forgot your password?
        </a>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isSubmitting} // Disable while the API call is in progress
        className="btn-primary w-full btn-lg"
      >
        {/* Show a spinner while submitting, normal text otherwise */}
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
};

export default LoginForm;
