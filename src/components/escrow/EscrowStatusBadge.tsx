

import { STATUS_META, type EscrowStatusBadgeProps } from "./escrowBadgeConstants";

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
