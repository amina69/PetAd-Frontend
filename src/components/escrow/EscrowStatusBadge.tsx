import { getStatusMeta } from "../../lib/statusConfig";
import type { EscrowStatus } from "./types";
import { StatusBadge } from "../ui/StatusBadge";

export interface EscrowStatusBadgeProps {
  status: EscrowStatus;
}

export function EscrowStatusBadge({ status }: EscrowStatusBadgeProps) {
  return (
    <StatusBadge
      meta={getStatusMeta("escrow", status)}
      data-testid="escrow-status-badge"
    />
  );
}
