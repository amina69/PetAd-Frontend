import type { EscrowStatus } from "./types";

const STATUS_META: Record<
  EscrowStatus,
  { label: string; className: string }
> = {
  AWAITING_FUNDS: {
    label: "Awaiting Funds",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  FUNDED: {
    label: "Funded",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
  IN_REVIEW: {
    label: "In Review",
    className: "bg-violet-100 text-violet-800 border-violet-200",
  },
  DISPUTED: {
    label: "Disputed",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
  SETTLED: {
    label: "Settled",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  SETTLEMENT_FAILED: {
    label: "Settlement Failed",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

interface EscrowStatusBadgeProps {
  status: EscrowStatus;
}

export function EscrowStatusBadge({ status }: EscrowStatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${meta.className}`}
      data-testid="escrow-status-badge"
    >
      {meta.label}
    </span>
  );
}
