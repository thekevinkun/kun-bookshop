// Import hooks we need to check auth state and redirect
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

// Define the props — requireAdmin is optional, defaults to false
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean; // If true, only admins can access this route
}

const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  // Get the current user and auth state from the Zustand store
  const { user, isAuthenticated } = useAuthStore();

  // If not logged in at all, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the route requires admin and the user is not an admin, send them home
  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // All checks passed — render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
