import { apiClient } from "../lib/api-client";
import type { AdoptionApprovalsState } from "../types/adoption";

interface SubmitApprovalDecisionPayload {
  decision: "APPROVED" | "REJECTED";
  reason?: string;
}

export const adoptionApprovalsService = {
  async getAdoptionApprovals(adoptionId: string): Promise<AdoptionApprovalsState> {
    return apiClient.get(`/adoption/${adoptionId}/approvals`);
  },

  async submitApprovalDecision(
    adoptionId: string,
    payload: SubmitApprovalDecisionPayload,
  ): Promise<AdoptionApprovalsState> {
    return apiClient.post(`/adoption/${adoptionId}/approvals`, payload);
  },
};
