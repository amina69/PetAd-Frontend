import { getStatusMeta } from "../../lib/statusConfig";
import type { CustodyStatus } from "../../types/adoption";
import { StatusBadge } from "../ui/StatusBadge";

interface CustodyStatusBadgeProps {
  status: CustodyStatus | string;
}

export function CustodyStatusBadge({ status }: CustodyStatusBadgeProps) {
  return <StatusBadge meta={getStatusMeta("custody", status)} />;
}
