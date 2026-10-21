import { apiClient } from "../lib/api-client";
import type { EscrowStatusResponse } from "../lib/hooks/useEscrowStatus";
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
   * Fetch the live status of the given escrow.
   *
   * This is the endpoint the custody feature reads so that escrow state is
   * always **server-sourced** — it is never derived client-side from the
   * custody arrangement's own status.
   *
   * @param escrowId - The ID of the escrow.
   */
  async getStatus(escrowId: string): Promise<EscrowStatusResponse> {
    return apiClient.get<EscrowStatusResponse>(`/escrow/${escrowId}/status`);
  },

  /**
   * Fetch the settlement breakdown for the given escrow.
   * @param escrowId - The ID of the escrow.
   */
  async getSettlementSummary(escrowId: string): Promise<SettlementSummary> {
    return apiClient.get<SettlementSummary>(`/escrow/${escrowId}/settlement-summary`);
  },
};
