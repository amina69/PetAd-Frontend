import type { ApprovalDecision, DecisionStatus } from "../../../types/adoption";

export interface ApprovalListParams {
  status?: DecisionStatus | string;
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  shelter?: string;
  overdueOnly?: boolean;
  [key: string]: unknown;
}

export interface ApprovalItem extends Omit<Partial<ApprovalDecision>, "status"> {
  id: string;
  adoptionId?: string;
  petName?: string;
  applicantName?: string;
  status?: DecisionStatus | string;
  role?: string;
  submittedAt?: string;
  isOverdue?: boolean;
  daysWaiting?: number;
  [key: string]: unknown;
}

export interface ApprovalListResponse {
  items: ApprovalItem[];
  total?: number;
  page?: number;
  limit?: number;
  nextCursor?: string | null;
  [key: string]: unknown;
}
