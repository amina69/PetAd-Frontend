import type { ReactNode } from "react";
import { useRoleGuard } from "../../hooks/useRoleGuard";

/** Renders children for admins only; everyone else sees an access-denied notice. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useRoleGuard();
  if (isAdmin) return <>{children}</>;
  return (
    <div role="alert" className="mx-auto max-w-xl p-8 text-center text-gray-700">
      <h1 className="text-xl font-bold">Access denied</h1>
      <p className="mt-2 text-sm">You need administrator access to view this page.</p>
    </div>
  );
}
