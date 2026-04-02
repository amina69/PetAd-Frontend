import { apiClient } from "../lib/api-client";
import type { SettlementSummary } from "../types/escrow";


/**
 * escrowService
 *
 * Real escrow API calls via the api-client.
 */
export const escrowService = {
  async retrySettlement(escrowId: string): Promise<void> {
    return apiClient.post(`/escrow/${escrowId}/retry-settlement`);
  },

  /**
   * Fetch the settlement breakdown for the given escrow.
   * @param escrowId - The ID of the escrow.
   */
  async getSettlementSummary(escrowId: string): Promise<SettlementSummary> {
    return apiClient.get<SettlementSummary>(`/escrow/${escrowId}/settlement-summary`);
  },
};
