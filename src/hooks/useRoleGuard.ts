import type { UserRole } from "../types/auth";

/**
 * useRoleGuard
 *
 * Reads the current user's role and exposes convenience booleans.
 * We normalize the stored value so older lowercase role flags and the current
 * uppercase auth roles can coexist safely during the transition.
 */
export function useRoleGuard() {
  const storedRole =
    typeof window !== "undefined"
      ? localStorage.getItem("petad_user_role") ?? localStorage.getItem("role")
      : null;

  const normalizedRole = storedRole?.toUpperCase() ?? "";
  const role = normalizedRole as UserRole | "";

  const hasAccess = (roles: string[]) => {
    if (!role) return false;
    return roles.map((value) => value.toUpperCase()).includes(role);
  };

  return {
    role,
    isAdmin: role === "ADMIN",
    isShelter: role === "SHELTER",
    isUser: role === "USER",
    canApprove: role === "ADMIN" || role === "SHELTER",
    hasAccess,
  };
}
