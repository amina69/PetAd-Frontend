export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";

export type ResolutionType = "REFUND" | "RELEASE" | "SPLIT";

export interface DisputeResolution {
  type: ResolutionType;
  adminNote: string;
  resolvedBy: string;
  resolvedAt: string;
  resolutionTxHash: string;
  distribution?: {
    recipient: string;
    amount: string;
    percentage: number;
  }[];
}

export interface Dispute {
  id: string;
  adoptionId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution?: DisputeResolution | null;
  createdAt: string;
  updatedAt: string;
}