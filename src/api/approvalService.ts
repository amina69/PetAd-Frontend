import { apiClient } from "../lib/api-client";

export interface ApprovalItem {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalResponse {
  data: ApprovalItem[];
  total: number;
  limit: number;
  offset: number;
}

export const approvalService = {
  async getPendingApprovals(): Promise<ApprovalResponse> {
    return apiClient.get("/shelter/approvals?status=PENDING&limit=0");
  },
};
