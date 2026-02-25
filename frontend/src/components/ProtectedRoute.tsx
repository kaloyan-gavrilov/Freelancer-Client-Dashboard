import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from './LoadingScreen';

/**
 * Wraps routes that require an authenticated session.
 * Redirects to /login if no active session exists.
 * Shows nothing while the initial session check is in progress.
 */
export function ProtectedRoute(): React.ReactNode {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
