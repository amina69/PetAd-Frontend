import { apiClient } from "../lib/api-client";
import type { EscrowRecordSummary, SettlementSummary } from "../types/escrow";


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

  /**
   * Fetch the escrow record for the given escrow.
   *
   * Only the lifecycle state (and an optional dispute reference) is surfaced
   * to the caller — the record's keys, secrets and transaction identifiers are
   * never handed to the UI layer.
   *
   * @param escrowId - The ID of the escrow.
   */
  async getById(escrowId: string): Promise<EscrowRecordSummary> {
    return apiClient.get<EscrowRecordSummary>(`/escrow/${encodeURIComponent(escrowId)}`);
  },
};
