import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { LoadingScreen } from './LoadingScreen';

interface RoleRouteProps {
  allowedRole: UserRole;
}

/**
 * Wraps routes restricted to a specific role.
 * If the authenticated user's role does not match, they are redirected
 * to the dashboard for their actual role.
 *
 * Must be nested inside a ProtectedRoute so `user` is guaranteed non-null.
 */
export function RoleRoute({ allowedRole }: RoleRouteProps): React.ReactNode {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    const destination =
      user.role === UserRole.CLIENT ? '/client/dashboard' : '/freelancer/dashboard';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
