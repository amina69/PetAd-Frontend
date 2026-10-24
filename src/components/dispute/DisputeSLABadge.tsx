import { getStatusMeta, SLA_HEALTHY_META } from "../../lib/statusConfig";
import { StatusBadge } from "../ui/StatusBadge";

interface DisputeSLABadgeProps {
  isOverdue: boolean;
}

export function DisputeSLABadge({ isOverdue }: DisputeSLABadgeProps) {
  const meta = isOverdue
    ? getStatusMeta("dispute", "SLA_BREACHED")
    : SLA_HEALTHY_META;

  return <StatusBadge meta={meta} data-testid="dispute-sla-badge" />;
}
