import SEO from "../../components/common/SEO";
import { RegisterForm } from "../../components/forms";

export default function RegisterPage() {
  return (
    <>
      <SEO
        title="Create Account"
        description="Create a free Kun Bookshop account to start buying and reading digital books."
        url="/register"
        noIndex={true}
      />

      <main className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
        <div className="section w-full max-w-md">
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
              Create your account
            </h1>
          </div>

          {/* FORM CARD */}
          <div className="card-base">
            <RegisterForm />

            {/* LOGIN LINK */}
            <div className="divider" />
            <p className="text-center text-sm text-text-muted">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-golden hover:underline font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
