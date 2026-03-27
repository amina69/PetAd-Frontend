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
