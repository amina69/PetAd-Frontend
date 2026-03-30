import { AlertCircle, CheckCircle2 } from "lucide-react";

interface DisputeSLABadgeProps {
  isOverdue: boolean;
}

export function DisputeSLABadge({ isOverdue }: DisputeSLABadgeProps) {
  if (isOverdue) {
    return (
      <span
        className="inline-flex gap-1.5 items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800"
        data-testid="dispute-sla-badge"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        SLA Breached
      </span>
    );
  }

  return (
    <span
      className="inline-flex gap-1.5 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
      data-testid="dispute-sla-badge"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      Within SLA
    </span>
  );
}
