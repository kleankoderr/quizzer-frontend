import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "./LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <LoadingScreen
        message="Verifying Session"
        subMessage="Checking your access permissions..."
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not completed and required
  // Admins bypass this check
  // Also bypass if the user is accessing challenges (deep link support)
  if (
    user &&
    !user.onboardingCompleted &&
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN" &&
    location.pathname !== "/onboarding" &&
    !location.pathname.startsWith("/challenges")
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
