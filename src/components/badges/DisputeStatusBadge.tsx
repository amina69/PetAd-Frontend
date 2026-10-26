import { getStatusMeta } from "../../lib/statusConfig";
import type { DisputeStatusCode } from "../../types/dispute";
import { StatusBadge } from "../ui/StatusBadge";

interface Props {
  status: DisputeStatusCode;
}

export function DisputeStatusBadge({ status }: Props) {
  return <StatusBadge meta={getStatusMeta("dispute", status)} />;
}
