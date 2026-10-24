import { apiClient } from "../../../lib/api-client";
import type { DisputeReason, DisputeRecord } from "../types/dispute.types";

/**
 * Payload accepted by `disputeService.createDispute`.
 *
 * The `reason`, `description` and `attachmentIds` fields mirror
 * `disputeFormSchema` (see `../schemas/disputeSchemas`), while
 * `adoptionOrCustodyId` links the dispute to the underlying record — the
 * same field exposed on `DisputeRecord`.
 */
export interface CreateDisputePayload {
  adoptionOrCustodyId: string;
  reason: DisputeReason;
  description: string;
  attachmentIds?: string[];
}

/**
 * Dispute API service.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/455
 */
export const disputeService = {
  /**
   * Create a dispute and return the persisted record (including its new id).
   * POST /disputes
   */
  async createDispute(payload: CreateDisputePayload): Promise<DisputeRecord> {
    return apiClient.post<DisputeRecord>("/disputes", payload);
  },
};
