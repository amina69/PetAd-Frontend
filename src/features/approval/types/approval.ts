import type { ApprovalStatus } from "../../../types/approval";

export type { ApprovalStatus };

export interface ApprovalRequest {
  id: string;
  petId: string;
  petName: string;
  requesterId: string;
  requesterName: string;
  type: "adoption" | "custody";
  status: ApprovalStatus;
  submittedAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
}

export type ApprovalListParams = {
  status?: ApprovalStatus;
  page?: number;
  pageSize?: number;
};
