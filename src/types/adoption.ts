export type AdoptionStatus =
  | "ESCROW_CREATED"
  | "ESCROW_FUNDED"
  | "SETTLEMENT_TRIGGERED"
  | "DISPUTED"
  | "FUNDS_RELEASED"
  | "CUSTODY_ACTIVE"
  | "EXPIRING_SOON"
  | "COMPLETED"
  | "CANCELLED";

export type CustodyStatus =
  | "PENDING"
  | "DEPOSIT_PENDING"
  | "DEPOSIT_CONFIRMED"
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "COMPLETING"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

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

export type DecisionStatus = "APPROVED" | "REJECTED" | "EXPIRED";

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
