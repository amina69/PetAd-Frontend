import { Navigate, useLocation } from "react-router-dom";
import { AUTH_TOKEN_KEY, canAccessRole, readRole, rememberReturnPath } from "./session";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    rememberReturnPath(`${location.pathname}${location.search}`);
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function RequireRole({
  allow,
  children,
}: {
  allow: string[];
  children: React.ReactNode;
}) {
  if (!canAccessRole(readRole(), allow)) {
    return <Navigate to="/home" replace />;
  }
  return children;
}
