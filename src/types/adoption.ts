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
  status: AdoptionStatus;
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
