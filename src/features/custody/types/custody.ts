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
}
