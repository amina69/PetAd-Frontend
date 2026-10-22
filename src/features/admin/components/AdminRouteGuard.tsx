import { Navigate, Outlet } from "react-router-dom";
import { useRoleGuard } from "../../../hooks/useRoleGuard";

/** Keep admin route modules behind the role check so unauthorized visits do not load them. */
export function AdminRouteGuard() {
  const { isAdmin } = useRoleGuard();
  return isAdmin ? <Outlet /> : <Navigate to="/403" replace />;
}
