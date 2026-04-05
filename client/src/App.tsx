import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./routes/auth";

import { useAuthStore } from "./store/auth";

import HomePage from "./routes/index";
import BooksPage from "./routes/books/index";
import BookDetailPage from "./routes/books/[id]";

import { CheckoutSuccessPage, CheckoutCancelPage } from "./routes/checkout";

import { MainLayout, AuthLayout } from "./components/layout";
import ScrollToTop from "./components/ui/ScrollToTop";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* AUTH ROUTES (NO NAVBAR / FOOTER) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />
        </Route>

        {/* MAIN APP ROUTES (WITH NAVBAR + FOOTER) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />

          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <div>Library — Phase 5</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile — Phase 5</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Admin — Phase 7</div>
              </ProtectedRoute>
            }
          />

          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
