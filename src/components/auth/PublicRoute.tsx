/**
 * PublicRoute
 *
 * A route wrapper for pages that are accessible to both authenticated and
 * unauthenticated (guest) users.
 *
 * Unlike ProtectedRoute (which redirects to /login when unauthenticated) and
 * GuestRoute (which redirects to /home when authenticated), PublicRoute simply
 * renders the Outlet for everyone.
 *
 * Use this for:
 *  - Homepage  (/home)
 *  - Listings  (/listings, /listings/:id)
 *  - Dashboard-style pages showing public/demo data
 */
import { Outlet } from 'react-router-dom';

/** Renders the nested route outlet for ALL visitors, authenticated or not. */
export function PublicRoute() {
  return <Outlet />;
}
