import { getStatusMeta } from "../../lib/statusConfig";
import type { DisputeStatus } from "../../types/dispute";
import { StatusBadge } from "../ui/StatusBadge";

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
}

export function DisputeStatusBadge({ status }: DisputeStatusBadgeProps) {
  return (
    <StatusBadge
      meta={getStatusMeta("dispute", status)}
      data-testid="dispute-status-badge"
    />
  );
}
