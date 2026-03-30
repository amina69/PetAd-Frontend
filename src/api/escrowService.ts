import type { SettlementSummary } from "../types/escrow";
import { ApiError } from "../lib/api-errors";

interface HttpError extends Error {
  status: number;
}

/**
 * escrowService
 *
 * Placeholder escrow API calls.
 * TODO: replace stub bodies with real HTTP calls via the api-client.
 */
export const escrowService = {
  async retrySettlement(escrowId: string): Promise<void> {
    const response = await fetch(`/api/escrow/${escrowId}/retry-settlement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      // Create error with status properly
      const error = new Error("Failed to retry settlement") as HttpError;
      error.status = response.status;
      throw error;
      throw new ApiError("Failed to retry settlement", {
        status: response.status,
      });
    }
  },

  async getSettlementSummary(escrowId: string): Promise<SettlementSummary> {
    const response = await fetch(`/api/escrow/${escrowId}/settlement-summary`);

    if (!response.ok) {
      const error = new Error("Failed to fetch settlement summary") as HttpError;
      error.status = response.status;
      throw error;
    }

    return (await response.json()) as SettlementSummary;
      throw new ApiError("Failed to fetch settlement summary", {
        status: response.status,
      });
    }
    return response.json() as Promise<SettlementSummary>;
  },
};