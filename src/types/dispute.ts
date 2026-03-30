export type DisputeStatus = "open" | "under_review" | "resolved" | "closed";

export interface DisputeUser {
  id: string;
  name: string;
}

export interface DisputePet {
  id: string;
  name: string;
}

export interface Evidence {
  id: string;
  type: "document" | "photo" | "statement";
  url: string;
  submittedBy: string;
  submittedAt: string;
}

export interface TimelineEvent {
  event: string;
  actor: string;
  timestamp: string;
}

export interface Dispute {
  id: string;
  adoptionId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  isOverdue: boolean; // Indicates if SLA is breached
  
  // Relations for list view
  pet: DisputePet;
  adopter: DisputeUser;
  shelter: DisputeUser;
  
  evidence: Evidence[];
  timeline: TimelineEvent[];
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeListResponse {
  data: Dispute[];
  nextCursor?: string;
}

export interface DisputeEvent {
  id: string;
  disputeId: string;
  type: string;
  createdAt: string;
  message?: string;
  actor?: string;
  actorRole?: string;
  sdkPauseConfirmed?: boolean;
  resolutionTxHash?: string;
}

export interface DisputeDetails {
  id: string;
  adoptionId: string;
  status: DisputeStatus;
  reason: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  events: DisputeEvent[];
}
