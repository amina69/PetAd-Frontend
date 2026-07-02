import { usePendingApprovalsCount } from "../../hooks/usePendingApprovalsCount";
import { useRoleGuard } from "../../hooks/useRoleGuard";

interface PendingApprovalBadgeProps {
  className?: string;
}

export function PendingApprovalBadge({ className = "" }: PendingApprovalBadgeProps) {
  const { canApprove } = useRoleGuard();
  const { count, displayCount } = usePendingApprovalsCount();

  if (!canApprove || count === 0) {
    return null;
  }

  return (
    <span
      data-testid="pending-approval-badge"
      aria-label={`${count} pending approval${count === 1 ? "" : "s"}`}
      className={`inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ${className}`}
    >
      {displayCount}
    </span>
  );
}
