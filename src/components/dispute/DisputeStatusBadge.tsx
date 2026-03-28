import type { DisputeStatus } from "../../types/dispute";

const STATUS_META: Record<
  DisputeStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  under_review: {
    label: "Under Review",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-800 border-slate-200",
  },
};

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
}

export function DisputeStatusBadge({ status }: DisputeStatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}
      data-testid="dispute-status-badge"
    >
      {meta.label}
    </span>
  );
}
