export type AdoptionStatus =
  | "ESCROW_CREATED"
  | "ESCROW_FUNDED"
  | "SETTLEMENT_TRIGGERED"
  | "DISPUTED"
  | "FUNDS_RELEASED"
  | "CUSTODY_ACTIVE"
  | "FUNDS_RELEASED";

export interface AdoptionRating {
  rating: number;
  feedback: string;
  adoptionId?: string;
  petId?: string;
}

export type ApprovalDecision = "approve" | "reject";

export interface ApprovalDecisionPayload {
  decision: ApprovalDecision;
  reason?: string;
}

export interface ApprovalItem {
  id: string;
  adoptionId: string;
  reviewer: {
    id: string;
    name: string;
    role: string;
  };
  decision: "approve" | "reject" | "pending";
  notes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdoptionTimelineEntry {
  id: string;
  adoptionId: string;
  timestamp: string;
  sdkEvent: string;
  message: string;
  actor?: string;
}