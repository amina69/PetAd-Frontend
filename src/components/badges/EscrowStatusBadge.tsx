import { getStatusMeta } from "../../lib/statusConfig";
import type { DisputeEscrowStatus } from "../../types/dispute";
import { StatusBadge } from "../ui/StatusBadge";

interface Props {
  status: DisputeEscrowStatus;
}

export function EscrowStatusBadge({ status }: Props) {
  return <StatusBadge meta={getStatusMeta("escrow", status)} />;
}
