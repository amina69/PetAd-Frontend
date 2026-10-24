import { getStatusMeta } from "../../lib/statusConfig";
import type { EscrowLifecycleStatus } from "../../types/escrow";
import { StatusBadge } from "./StatusBadge";

interface EscrowStatusBadgeProps {
  status: EscrowLifecycleStatus | string;
}

export function EscrowStatusBadge({ status }: EscrowStatusBadgeProps) {
  return <StatusBadge meta={getStatusMeta("escrow", status)} />;
}
