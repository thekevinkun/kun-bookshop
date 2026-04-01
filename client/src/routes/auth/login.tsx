// Import useLocation to read the state passed from RegisterForm after signup
import { useLocation } from "react-router-dom";
import { LoginForm } from "../../components/forms";

const LoginPage = () => {
  // useLocation lets us read the { message } state that RegisterForm passes on redirect
  const location = useLocation();

  // If the user just registered, location.state.message will have a success message
  const successMessage = location.state?.message;

  return (
    // Full page centered layout — matches our dark navy background
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* LOGO / BRAND */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">📚 Kun Bookshop</h1>
          <p className="text-text-muted mt-2">Sign in to your account</p>
        </div>

        {/* SUCCESS MESSAGE — shown after registration */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30">
            <p className="text-sm text-success">{successMessage}</p>
          </div>
        )}

        {/* FORM CARD */}
        <div className="card-base">
          <LoginForm />

          {/* REGISTER LINK */}
          <div className="divider" />
          <p className="text-center text-sm text-text-muted">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-teal hover:underline font-medium"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
