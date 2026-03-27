import { apiClient } from "../lib/api-client";
import type { DisputeDetails } from "../types/dispute";

export const disputeService = {
	async getDetails(disputeId: string): Promise<DisputeDetails> {
		return apiClient.get<DisputeDetails>(`/disputes/${disputeId}`);
	},
};