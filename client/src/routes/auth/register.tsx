import { RegisterForm } from "../../components/forms";

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* LOGO / BRAND */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">📚 Kun Bookshop</h1>
          <p className="text-text-muted mt-2">Create your account</p>
        </div>

        {/* FORM CARD */}
        <div className="card-base">
          <RegisterForm />

          {/* LOGIN LINK */}
          <div className="divider" />
          <p className="text-center text-sm text-text-muted">
            Already have an account?{" "}
            <a href="/login" className="text-teal hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
