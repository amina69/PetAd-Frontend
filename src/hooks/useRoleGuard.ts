/**
 * useRoleGuard
 *
 * Reads the current user's role and exposes convenience booleans.
 * Role is stored under the "petad_user_role" key in localStorage so it can be
 * swapped for a React context / auth provider once one is wired up.
 *
 * Supported role values: "admin" | "shelter" | "user"
 */
export function useRoleGuard() {
  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("petad_user_role")
      : null;

  return {
    role,
    isAdmin: role === "admin",
    isShelter: role === "shelter",
    isUser: role === "user",
  };
}
