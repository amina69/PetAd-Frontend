import { getStatusMeta } from "../../../lib/statusConfig";
import type { StatusColorToken } from "../../../lib/statusConfig";
import type { LucideIcon } from "lucide-react";
import type { DisputeStatus } from "../types/dispute.types";

export interface DisputeStatusConfig {
  label: string;
  description: string;
  colorVariant: StatusColorToken;
  icon: LucideIcon;
  hasPulse?: boolean;
}

/**
 * Thin adapter over the shared status config.
 *
 * The label, description, colour token and pulse flag all come from
 * `src/lib/statusConfig.ts`, so the dispute badges can never drift from the
 * other domains.
 */
export const DISPUTE_STATUS_CONFIG: Record<DisputeStatus, DisputeStatusConfig> = {
  OPEN: toDisputeStatusConfig("OPEN"),
  UNDER_REVIEW: toDisputeStatusConfig("UNDER_REVIEW"),
  RESOLVED: toDisputeStatusConfig("RESOLVED"),
  CLOSED: toDisputeStatusConfig("CLOSED"),
  SLA_BREACHED: toDisputeStatusConfig("SLA_BREACHED"),
};

function toDisputeStatusConfig(status: DisputeStatus): DisputeStatusConfig {
  const meta = getStatusMeta("dispute", status);

  return {
    label: meta.label,
    description: meta.description,
    colorVariant: meta.color,
    icon: meta.icon,
    hasPulse: meta.pulse,
  };
}
