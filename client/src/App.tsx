// Import BrowserRouter and routing components from React Router v7
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import our auth pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./routes/auth";

// Import our Zustand store to check auth state for protected routes
import { useAuthStore } from "./store/auth";

// A simple wrapper that redirects to /login if the user is not authenticated
// Wrap any route you want to protect with this component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  // If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the protected content
  return <>{children}</>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES — anyone can access these */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* PLACEHOLDER HOME — we'll build this in Phase 3 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* Temporary home placeholder until Phase 3 */}
              <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold text-gradient">
                    📚 Kun Bookshop
                  </h1>
                  <p className="text-text-muted">
                    Phase 2 complete — Authentication working!
                  </p>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* CATCH ALL — redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
