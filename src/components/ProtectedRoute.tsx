import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireOnboarding = true 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Verifying Session" subMessage="Checking your access permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not completed and required
  // Admins bypass this check
  if (
    requireOnboarding && 
    !user?.onboardingCompleted && 
    user?.role !== 'ADMIN' && 
    user?.role !== 'SUPER_ADMIN'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
