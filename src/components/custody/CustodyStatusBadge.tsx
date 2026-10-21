import { AlertTriangle } from "lucide-react";
import type { CustodyStatus } from "../../types/adoption";
import { StatusBadge, type StatusBadgeColor } from "../ui/StatusBadge";

interface CustodyStatusBadgeProps {
  status: CustodyStatus | string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: StatusBadgeColor;
    tooltip: string;
    showWarningIcon?: boolean;
  }
> = {
  PENDING: {
    label: "Pending",
    color: "gray",
    tooltip: "Custody is pending and has not started yet.",
  },
  DEPOSIT_PENDING: {
    label: "Deposit Pending",
    color: "blue",
    tooltip: "Custody deposit is awaiting payment confirmation.",
  },
  DEPOSIT_CONFIRMED: {
    label: "Deposit Confirmed",
    color: "teal",
    tooltip: "Custody deposit has been confirmed.",
  },
  ACTIVE: {
    label: "Active",
    color: "green",
    tooltip: "Custody is currently active.",
  },
  EXPIRING_SOON: {
    label: "Expiring Soon",
    color: "amber",
    tooltip: "Custody is close to ending and requires attention.",
    showWarningIcon: true,
  },
  COMPLETING: {
    label: "Completing",
    color: "amber",
    tooltip: "Custody is in the completion process.",
  },
  COMPLETED: {
    label: "Completed",
    color: "green",
    tooltip: "Custody has been completed successfully.",
  },
  DISPUTED: {
    label: "Disputed",
    color: "red",
    tooltip: "A dispute has been raised for this custody.",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "gray",
    tooltip: "Custody was cancelled before completion.",
  },
  NOT_FOUND: {
    label: "Not Found",
    color: "gray",
    tooltip: "Unknown custody status.",
  },
  // ── Temporary Custody domain statuses (lower-case) ────────────────────────
  // See `src/features/custody/types/custody.ts`.
  requested: {
    label: "Requested",
    color: "gray",
    tooltip: "This custody request has not been approved yet.",
  },
  approved: {
    label: "Approved",
    color: "blue",
    tooltip: "This custody request has been approved.",
  },
  active: {
    label: "Active",
    color: "green",
    tooltip: "Custody is currently active.",
  },
  completed: {
    label: "Completed",
    color: "green",
    tooltip: "Custody has been completed successfully.",
  },
  cancelled: {
    label: "Cancelled",
    color: "gray",
    tooltip: "Custody was cancelled before completion.",
  },
  disputed: {
    label: "Disputed",
    color: "red",
    tooltip: "A dispute has been raised for this custody.",
  },
};

export function CustodyStatusBadge({ status }: CustodyStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_FOUND;

  return (
    <StatusBadge
      color={config.color}
      label={config.label}
      tooltip={config.tooltip}
      icon={
        config.showWarningIcon ? (
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
        ) : null
      }
    />
  );
}
