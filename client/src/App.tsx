import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./routes/auth";

import HomePage from "./routes/index";
import BooksPage from "./routes/books/index";
import BookDetailPage from "./routes/books/[id]";

import { CheckoutSuccessPage, CheckoutCancelPage } from "./routes/checkout";

import LibraryPage from "./routes/library/index";
import ProfilePage from "./routes/profile/index";

import {
  AdminLayout,
  AdminDashboard,
  AdminBooks,
  AdminUsers,
  AdminOrders,
  AdminAuthors,
  AdminReviews,
} from "./routes/admin";

import { MainLayout, AuthLayout } from "./components/layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ScrollToTop from "./components/ui/ScrollToTop";

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
                <LibraryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
        </Route>

        {/* ADMIN ROUTES (NO PUBLIC NAVBAR / FOOTER) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* /admin redirects to /admin/dashboard by default */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="books" element={<AdminBooks />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="authors" element={<AdminAuthors />} />
          <Route path="reviews" element={<AdminReviews />} />
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
