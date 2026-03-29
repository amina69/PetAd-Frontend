import { apiClient } from "../lib/api-client";
import type { ShelterApprovalsResponse } from "../types/shelter";

export const shelterService = {
  async getApprovals(
    status: string = "PENDING",
    page: number = 1,
    limit: number = 10
  ): Promise<ShelterApprovalsResponse> {
    return apiClient.get(
      `/shelter/approvals?status=${status}&page=${page}&limit=${limit}`
    );
  },
};
