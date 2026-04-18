import { lazy, Suspense } from "react"; // lazy loads a component only when it's needed
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// A simple full-screen small icon shown while a lazy chunk is loading
// Keeps the app feeling smooth instead of showing a blank screen
const PageLoader = () => (
  <main
    style={{ backgroundColor: "#0a1628" }}
    className="min-h-screen flex items-center justify-center"
  >
    <img 
      src="/images/logo.webp"
      alt="logo loading"
      className="w-10 h-10 object-cover animate-pulse"
    />
  </main>
);

// AUTH ROUTES — only loaded when user visits /login, /register, etc.
const LoginPage = lazy(() =>
  import("./routes/auth").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./routes/auth").then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./routes/auth").then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./routes/auth").then((m) => ({ default: m.ResetPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import("./routes/auth").then((m) => ({ default: m.VerifyEmailPage })),
);

// MAIN ROUTES — each splits into its own chunk
const HomePage = lazy(() => import("./routes/index"));
const BooksPage = lazy(() => import("./routes/books/index"));
const BookDetailPage = lazy(() => import("./routes/books/[id]"));
const AuthorProfilePage = lazy(() => import("./routes/authors/[id]"));

const CheckoutSuccessPage = lazy(() =>
  import("./routes/checkout").then((m) => ({ default: m.CheckoutSuccessPage })),
);
const CheckoutCancelPage = lazy(() =>
  import("./routes/checkout").then((m) => ({ default: m.CheckoutCancelPage })),
);

const LibraryPage = lazy(() => import("./routes/library/index"));
const ProfilePage = lazy(() => import("./routes/profile/index"));
const OrdersPage = lazy(() => import("./routes/profile/orders"));
const EditProfilePage = lazy(() => import("./routes/profile/edit"));
const ChangePasswordPage = lazy(() => import("./routes/profile/password"));

// ADMIN ROUTES — heaviest chunk, only admins ever load this
const AdminDashboard = lazy(() =>
  import("./routes/admin").then((m) => ({ default: m.AdminDashboard })),
);
const AdminBooks = lazy(() =>
  import("./routes/admin").then((m) => ({ default: m.AdminBooks })),
);
const AdminUsers = lazy(() =>
  import("./routes/admin").then((m) => ({ default: m.AdminUsers })),
);
const AdminOrders = lazy(() =>
  import("./routes/admin").then((m) => ({ default: m.AdminOrders })),
);
const AdminAuthors = lazy(() =>
  import("./routes/admin").then((m) => ({ default: m.AdminAuthors })),
);
const AdminReviews = lazy(() =>
  import("./routes/admin").then((m) => ({ default: m.AdminReviews })),
);
const AdminCoupons = lazy(() =>
  import("./routes/admin").then((m) => ({ default: m.AdminCoupons })),
);

const GraphQLDemoPage = lazy(() => import("./routes/graphql-demo/index"));

// LAYOUTS — these stay eagerly loaded because every page needs them immediately
import { MainLayout, AuthLayout } from "./components/layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { ScrollToTop } from "./components/ui";

// Imports only the layout shell, nothing else
import AdminLayout from "./routes/admin/layout";

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Suspense catches any lazy component that's still loading and shows PageLoader */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* AUTH ROUTES */}
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

          {/* MAIN APP ROUTES */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/authors/:id" element={<AuthorProfilePage />} />
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
            <Route
              path="/profile/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="authors" element={<AdminAuthors />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>

          <Route path="/graphql-demo" element={<GraphQLDemoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
