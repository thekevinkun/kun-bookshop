import SEO from "../../components/common/SEO";
import { ForgotPasswordForm } from "../../components/forms";

export default function ForgotPasswordPage() {
  return (
    <>
      <SEO
        title="Forgot Password"
        description="Reset your password by requesting a secure password reset link for your Kun Bookshop account."
        url="/forgot-password"
        noIndex={true}
      />

      <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
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
              Reset your password
            </h1>
          </div>

          {/* FORM CARD */}
          <div className="card-base">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
    </>
  );
}
