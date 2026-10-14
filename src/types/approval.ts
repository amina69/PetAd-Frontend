export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface ApprovalRequest {
  id: string;
  adopterId: string;
  petId: string;
  shelterId: string;
  status: ApprovalStatus;
  submittedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  reason?: string;
  notes?: string;
}

export interface ApprovalListParams {
  status?: ApprovalStatus[];
  shelterId?: string;
  petId?: string;
  adopterId?: string;
  limit?: number;
  offset?: number;
}

export interface RejectRequestInput {
  reason: string;
  notes?: string;
}
