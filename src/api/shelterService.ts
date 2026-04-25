import { apiClient } from "../lib/api-client";

export interface PendingApprovalsResponse {
  count: number;
  items?: unknown[];
}

export const shelterService = {
  async getPendingApprovalsCount(): Promise<PendingApprovalsResponse> {
    return apiClient.get("/shelter/approvals?status=PENDING&limit=0");
  },
};
