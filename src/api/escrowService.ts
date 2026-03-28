import type { SettlementSummary } from "../types/escrow";
import { ApiError } from "../lib/api-errors";

/**
 * escrowService
 *
 * Placeholder escrow API calls.
 * TODO: replace stub bodies with real HTTP calls via the api-client.
 */
export const escrowService = {
  /**
   * Retry a failed settlement for the given escrow.
   * @param escrowId - The ID of the escrow to retry settlement for.
   */
  async retrySettlement(escrowId: string): Promise<void> {
    const response = await fetch(`/api/escrow/${escrowId}/retry-settlement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const error = new ApiError("Failed to retry settlement", response?.status);
      error.status = response.status;
      throw error;
    }
  },

  /**
   * Fetch the settlement breakdown for the given escrow.
   * @param escrowId - The ID of the escrow.
   */
  async getSettlementSummary(escrowId: string): Promise<SettlementSummary> {
    const response = await fetch(`/api/escrow/${escrowId}/settlement-summary`);
    if (!response.ok) {
        const error = new ApiError("Failed to fetch settlement summary", response?.status);
        throw error;
    }
    return response.json();
  },
};
