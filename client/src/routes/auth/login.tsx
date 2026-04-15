import { useLocation } from "react-router-dom";
import { LoginForm } from "../../components/forms";

export default function LoginPage() {
  const location = useLocation();
  const successMessage = location.state?.message;

  return (
    <div className="min-h-[calc(100vh-50px)] flex bg-bg-dark">
      {/* LEFT SIDE — IMAGE */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/images/bg-login.webp"
          alt="Login background"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Optional overlay for darkening (VERY important for aesthetic) */}
        <div className="absolute inset-0 bg-[#0a1628]/15 backdrop-blur-[0.5px]" />
      </div>

      {/* RIGHT SIDE — FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* LOGO / BRAND */}
          <div className="mb-8">
            <h1 className="text-3xl text-center font-bold text-gradient">
              📚 Kun Bookshop
            </h1>
            <p className="text-text-muted text-center mt-2">
              Welcome back — continue your reading journey
            </p>
          </div>

          {/* SUCCESS MESSAGE */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30">
              <p className="text-sm text-success">{successMessage}</p>
            </div>
          )}

          {/* FORM CARD */}
          <div className="card-base">
            <LoginForm />

            <div className="divider" />

            <p className="text-center text-sm text-text-muted">
              Don't have an account?{" "}
              <a
                href="/register"
                className="text-golden hover:underline font-medium"
              >
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
