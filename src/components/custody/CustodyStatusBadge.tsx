import { AlertTriangle } from "lucide-react";
import type { CustodyStatus } from "../../types/adoption";

interface CustodyStatusBadgeProps {
  status: CustodyStatus | string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    textClass: string;
    bgClass: string;
    tooltip: string;
    showWarningIcon?: boolean;
  }
> = {
  PENDING: {
    label: "Pending",
    textClass: "text-gray-700",
    bgClass: "bg-gray-100",
    tooltip: "Custody is pending and has not started yet.",
  },
  DEPOSIT_PENDING: {
    label: "Deposit Pending",
    textClass: "text-blue-700",
    bgClass: "bg-blue-100",
    tooltip: "Custody deposit is awaiting payment confirmation.",
  },
  DEPOSIT_CONFIRMED: {
    label: "Deposit Confirmed",
    textClass: "text-teal-700",
    bgClass: "bg-teal-100",
    tooltip: "Custody deposit has been confirmed.",
  },
  ACTIVE: {
    label: "Active",
    textClass: "text-green-700",
    bgClass: "bg-green-100",
    tooltip: "Custody is currently active.",
  },
  EXPIRING_SOON: {
    label: "Expiring Soon",
    textClass: "text-amber-700",
    bgClass: "bg-amber-100",
    tooltip: "Custody is close to ending and requires attention.",
    showWarningIcon: true,
  },
  COMPLETING: {
    label: "Completing",
    textClass: "text-amber-700",
    bgClass: "bg-amber-100",
    tooltip: "Custody is in the completion process.",
  },
  COMPLETED: {
    label: "Completed",
    textClass: "text-green-700",
    bgClass: "bg-green-100",
    tooltip: "Custody has been completed successfully.",
  },
  DISPUTED: {
    label: "Disputed",
    textClass: "text-red-700",
    bgClass: "bg-red-100",
    tooltip: "A dispute has been raised for this custody.",
  },
  CANCELLED: {
    label: "Cancelled",
    textClass: "text-gray-700",
    bgClass: "bg-gray-100",
    tooltip: "Custody was cancelled before completion.",
  },
  NOT_FOUND: {
    label: "Not Found",
    textClass: "text-gray-700",
    bgClass: "bg-gray-100",
    tooltip: "Unknown custody status.",
  },
};

export function CustodyStatusBadge({ status }: CustodyStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_FOUND;

  return (
    <div className="relative group inline-block">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${config.textClass} ${config.bgClass}`}
      >
        {config.showWarningIcon ? (
          <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
        ) : null}
        {config.label}
      </span>

      <div className="absolute left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block">
        <div className="rounded-md bg-black text-white text-xs px-2 py-1">
          {config.tooltip}
        </div>
      </div>
    </div>
  );
}
