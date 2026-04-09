import { ForgotPasswordForm } from "../../components/forms";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* LOGO / BRAND */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">📚 Kun Bookshop</h1>
          <p className="text-text-muted mt-2">Reset your password</p>
        </div>

        {/* FORM CARD */}
        <div className="card-base">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
