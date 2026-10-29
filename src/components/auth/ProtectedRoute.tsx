import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { rememberReturnPath } from '../../features/auth/session';

/**
 * Renders children/outlet only when authenticated; otherwise redirects to /login.
 * The page being left is remembered so signing in returns to it.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) return <Outlet />;
  rememberReturnPath(`${location.pathname}${location.search}`);
  return <Navigate to="/login" replace />;
}
