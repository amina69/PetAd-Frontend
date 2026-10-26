import type { ApprovalStatusCode } from "./approval";

/**
 * Adoption lifecycle status codes.
 *
 * The runtime array keeps the union and the value list in sync so the status
 * config can be verified exhaustively at test time.
 */
export const ADOPTION_STATUSES = [
  "ESCROW_CREATED",
  "ESCROW_FUNDED",
  "SETTLEMENT_TRIGGERED",
  "DISPUTED",
  "FUNDS_RELEASED",
  "CUSTODY_ACTIVE",
  "EXPIRING_SOON",
  "COMPLETED",
  "CANCELLED",
] as const;

export type AdoptionStatus = (typeof ADOPTION_STATUSES)[number];

/**
 * Temporary custody lifecycle status codes.
 */
export const CUSTODY_STATUSES = [
  "PENDING",
  "DEPOSIT_PENDING",
  "DEPOSIT_CONFIRMED",
  "ACTIVE",
  "EXPIRING_SOON",
  "COMPLETING",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
] as const;

export type CustodyStatus = (typeof CUSTODY_STATUSES)[number];

export interface AdoptionTimelineEntry {
  id: string;
  adoptionId: string;
  timestamp: string;
  sdkEvent: string;
  message: string;
  actor?: string;
  actorRole?: string;
  fromStatus?: AdoptionStatus;
  toStatus?: AdoptionStatus;
  sdkTxHash?: string;
  isAdminOverride?: boolean;
  reason?: string;
  escrowPaused?: boolean;
}

export interface AdoptionDetails {
  id: string;
  status: AdoptionStatus;
  petId: string;
  adopterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustodyDetails {
  id: string;
  status: CustodyStatus;
  petId: string;
  custodianId: string;
  ownerId: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEntry {
  fromStatus: AdoptionStatus | null;
  toStatus: AdoptionStatus;
  actor: string;
  reason?: string;
  sdkTxHash?: string;
  stellarExplorerUrl?: string;
  timestamp: string;
}

export type DecisionStatus = Extract<
  ApprovalStatusCode,
  "APPROVED" | "REJECTED" | "EXPIRED"
>;

export interface ApprovalDecision {
  id: string;
  approverName: string;
  approverRole: string;
  status: DecisionStatus;
  reason?: string;
  timestamp: string;
  txHash?: string;
}

export interface AdminApprovalQueueItem {
  id: string;
  shelter: string;
  pet: string;
  adopter: string;
  submitted: string;
  shelterApproved: boolean;
  daysWaiting: number;
  isOverdue: boolean;
}
