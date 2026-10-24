import type { AdoptionRequestStatus } from "../schemas/adoptionStatusSchema";

/**
 * Issue 39 — Adoption status configuration.
 *
 * Single source of truth for the adopter-facing status vocabulary: which
 * timeline step a status belongs to, whether it is terminal (polling may
 * stop), and how it should be presented.
 *
 * Timeline steps: inquiry → review → approved → completed.
 */

/** The four adopter-facing steps of a healthy adoption request. */
export type AdoptionTimelineStep = "inquiry" | "review" | "approved" | "completed";

export interface AdoptionStepDefinition {
  id: AdoptionTimelineStep;
  label: string;
  description: string;
}

/** Ordered timeline steps rendered by `AdoptionTimeline`. */
export const ADOPTION_TIMELINE_STEPS: readonly AdoptionStepDefinition[] = [
  {
    id: "inquiry",
    label: "Inquiry",
    description: "Adoption request submitted.",
  },
  {
    id: "review",
    label: "Review",
    description: "The shelter is reviewing your request.",
  },
  {
    id: "approved",
    label: "Approved",
    description: "Your request has been approved.",
  },
  {
    id: "completed",
    label: "Completed",
    description: "The adoption has been completed.",
  },
] as const;

export interface AdoptionStatusConfigEntry {
  /** Human-readable label for the status. */
  label: string;
  /** Timeline step this status advances the request to. */
  step: AdoptionTimelineStep;
  /**
   * Terminal statuses never change again — polling must stop and the UI
   * should present the outcome as final.
   */
  isTerminal: boolean;
  /** Presentation tone for badges/callouts. */
  tone: "info" | "warning" | "success" | "danger" | "neutral";
}

/**
 * Status → presentation/behaviour mapping.
 *
 * - `REQUESTED` — the inquiry has been received.
 * - `PENDING`   — under review.
 * - `APPROVED`/`ESCROW_FUNDED` — approved; escrow funding advances the
 *   blockchain-backed trust flow but stays on the "approved" step.
 * - `COMPLETED` — terminal success.
 * - `REJECTED`/`CANCELLED` — terminal failure; `REJECTED` may carry a
 *   `decisionReason` which the UI must surface.
 */
export const ADOPTION_STATUS_CONFIG: Record<
  AdoptionRequestStatus,
  AdoptionStatusConfigEntry
> = {
  REQUESTED: {
    label: "Inquiry received",
    step: "inquiry",
    isTerminal: false,
    tone: "info",
  },
  PENDING: {
    label: "Under review",
    step: "review",
    isTerminal: false,
    tone: "warning",
  },
  APPROVED: {
    label: "Approved",
    step: "approved",
    isTerminal: false,
    tone: "success",
  },
  ESCROW_FUNDED: {
    label: "Escrow funded",
    step: "approved",
    isTerminal: false,
    tone: "success",
  },
  COMPLETED: {
    label: "Completed",
    step: "completed",
    isTerminal: true,
    tone: "success",
  },
  REJECTED: {
    label: "Rejected",
    step: "review",
    isTerminal: true,
    tone: "danger",
  },
  CANCELLED: {
    label: "Cancelled",
    step: "review",
    isTerminal: true,
    tone: "neutral",
  },
};

/** Statuses after which polling must stop (issue: poll until terminal). */
export const TERMINAL_ADOPTION_STATUSES: readonly AdoptionRequestStatus[] =
  (Object.entries(ADOPTION_STATUS_CONFIG) as Array<
    [AdoptionRequestStatus, AdoptionStatusConfigEntry]
  >)
    .filter(([, entry]) => entry.isTerminal)
    .map(([status]) => status);

/** Whether a status is terminal — i.e. polling should stop. */
export function isTerminalAdoptionStatus(
  status: AdoptionRequestStatus | undefined,
): boolean {
  if (!status) {
    return false;
  }
  return ADOPTION_STATUS_CONFIG[status].isTerminal;
}

/** Look up the config entry for a status, falling back safely. */
export function getAdoptionStatusConfig(
  status: AdoptionRequestStatus,
): AdoptionStatusConfigEntry {
  return ADOPTION_STATUS_CONFIG[status];
}

/** Zero-based index of the timeline step a status advances to. */
export function getStepIndexForStatus(
  status: AdoptionRequestStatus | undefined,
): number {
  if (!status) {
    return -1;
  }
  const { step } = ADOPTION_STATUS_CONFIG[status];
  return ADOPTION_TIMELINE_STEPS.findIndex((s) => s.id === step);
}
