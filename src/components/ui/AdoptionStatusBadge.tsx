import { getStatusMeta } from "../../lib/statusConfig";
import type { AdoptionStatus } from "../../types/adoption";
import { StatusBadge } from "./StatusBadge";

interface AdoptionStatusBadgeProps {
  status: AdoptionStatus | string;
}

export function AdoptionStatusBadge({ status }: AdoptionStatusBadgeProps) {
  return <StatusBadge meta={getStatusMeta("adoption", status)} />;
}
