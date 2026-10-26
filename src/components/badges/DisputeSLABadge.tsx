import { getStatusMeta } from "../../lib/statusConfig";
import type { DisputeSlaStatus } from "../../types/dispute";
import { StatusBadge } from "../ui/StatusBadge";

interface Props {
  slaStatus: DisputeSlaStatus;
}

export function DisputeSLABadge({ slaStatus }: Props) {
  return <StatusBadge meta={getStatusMeta("sla", slaStatus)} />;
}
