import { useLocation } from "react-router-dom";
import SEO from "../../components/common/SEO";
import { LoginForm } from "../../components/forms";

export default function LoginPage() {
  const location = useLocation();
  const successMessage = location.state?.message;

  return (
    <>
      <SEO
        title="Sign In"
        description="Sign in to your Kun Bookshop account to access your library."
        url="/login"
        noIndex={true}
      />

      <div className="min-h-screen lg:min-h-[calc(100vh-50px)] flex bg-bg-dark">
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
                Welcome back — continue your reading journey
              </h1>
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
    </>
  );
}
