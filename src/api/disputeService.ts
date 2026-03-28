import { apiClient } from "../lib/api-client";

export interface ResolveDisputePayload {
  resolution: string;
  shelterPct: number;
  adopterPct: number;
  resolvedBy: string;
}

export interface ResolveDisputeResponse {
  id: string;
  adoptionId: string;
  status: "resolved";
  resolution: string;
  updatedAt: string;
}

export const disputeService = {
  async resolveDispute(
    disputeId: string,
    payload: ResolveDisputePayload,
  ): Promise<ResolveDisputeResponse> {
    return apiClient.patch<ResolveDisputeResponse>(
      `/disputes/${disputeId}/resolve`,
      payload,
    );
  },
};