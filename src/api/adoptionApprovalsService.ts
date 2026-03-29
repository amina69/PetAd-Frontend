import { apiClient } from "../lib/api-client";
import type { AdoptionApprovalsState } from "../types/adoption";

export const adoptionApprovalsService = {
  async getAdoptionApprovals(adoptionId: string): Promise<AdoptionApprovalsState> {
    return apiClient.get(`/adoption/${adoptionId}/approvals`);
  },
};
