import type { ReactNode } from "react";

export interface RoleGuardProps {
  /** The role(s) required to view this component */
  allowedRoles: string | string[];
  /** The current user's role (usually fetched from an auth context/hook) */
  userRole?: string;
  /** Content to display if the user has the required role */
  children: ReactNode;
  /** Content to display if the user does not have the required role */
  fallback?: ReactNode;
}

/**
 * A wrapper component to conditionally render UI elements based on user roles.
 */
export function RoleGuard({
  allowedRoles,
  userRole,
  children,
  fallback = null,
}: RoleGuardProps) {
  if (!userRole) return <>{fallback}</>;

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasAccess = roles.some(
    (role) => role.toLowerCase() === userRole.toLowerCase()
  );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}