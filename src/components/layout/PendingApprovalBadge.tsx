import { usePendingApprovals } from "../../hooks/usePendingApprovals";
import { useRoleGuard } from "../../hooks/useRoleGuard";

export function PendingApprovalBadge() {
  const { pendingCount } = usePendingApprovals();
  const { role } = useRoleGuard();

  // Only visible for SHELTER and ADMIN roles
  const isShelterOrAdmin = role === "admin" || role === "shelter";

  // Badge disappears when count reaches 0
  if (pendingCount === 0 || !isShelterOrAdmin) {
    return null;
  }

  // Max display: "9+" for counts above 9
  const displayCount = pendingCount > 9 ? "9+" : String(pendingCount);

  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
      {displayCount}
    </span>
  );
}
