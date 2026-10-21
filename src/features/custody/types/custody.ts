import type { EscrowRecordStatus } from "../../../types/escrow";

/**
 * D1. Canonical types for the Temporary Custody domain.
 *
 * Runtime validation for these shapes lives in `../schemas/custodySchemas.ts`.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/626
 */

/** Every state a custody arrangement can be in, in lifecycle order. */
export const CUSTODY_STATUSES = [
  "requested",
  "approved",
  "active",
  "completed",
  "cancelled",
  "disputed",
] as const;

export type CustodyStatus = (typeof CUSTODY_STATUSES)[number];

/**
 * Escrow state attached to a custody arrangement. Typed from the escrow
 * record shape so both domains agree on the status vocabulary.
 */
export type CustodyEscrowStatus = EscrowRecordStatus;

/** A temporary custody arrangement between a pet owner and a caretaker. */
export interface CustodyArrangement {
  id: string;
  petId: string;
  ownerId: string;
  caretakerId: string;
  /** ISO-8601 date or date-time string. */
  startDate: string;
  /** ISO-8601 date or date-time string. */
  endDate: string;
  status: CustodyStatus;
  notes: string | null;
  /** `null` until an escrow has been created for the arrangement. */
  escrowStatus: CustodyEscrowStatus | null;
  /**
   * Id of the escrow backing this arrangement, when the API exposes one.
   *
   * Used to read the live escrow snapshot from the escrow endpoint; when it
   * is absent the arrangement id is used as the escrow id.
   */
  escrowId?: string | null;
  /** Display name of the pet, when the API includes one. */
  petName?: string | null;
  /** Display name of the owner, when the API includes one. */
  ownerName?: string | null;
  /** Display name of the caretaker, when the API includes one. */
  caretakerName?: string | null;
}
