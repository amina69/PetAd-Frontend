/**
 * Dispute domain types defined at the module path named by issue #606.
 *
 * The remainder of the feature lives under `features/disputes` (plural) —
 * the same singular/plural split already established by
 * `features/dispute/hooks/useCreateDispute.ts` (issue #455).
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/606
 */

/**
 * Lifecycle of a dispute.
 *
 * Lowercase values match the API contract served by the MSW handlers
 * (`src/mocks/handlers/dispute.ts`) and the global `src/types/dispute.ts`.
 *
 * Note: `features/disputes/types/dispute.types.ts` exposes a separate,
 * uppercase union (`'OPEN' | …`) used by the status badge/config UI; the two
 * must be mapped at the API boundary until those are unified.
 *
 * Open question (#606): confirm with design/backend whether `closed` belongs
 * in this union as well.
 */
export type DisputeStatus = 'open' | 'under_review' | 'resolved';

/**
 * Reason a dispute was filed.
 *
 * Values intentionally mirror `disputeFormSchema.reason`
 * (`src/features/disputes/schemas/disputeSchemas.ts`) so the validated form
 * payload and the domain type can never drift apart.
 *
 * Open question (#606): confirm final values and Figma copy with
 * design/backend — `src/mocks/handlers/dispute.ts` currently returns a
 * different vocabulary (`misrepresentation`, `delayed_handover`,
 * `misleading_photos`, …).
 */
export type DisputeReason =
  | 'pet_condition'
  | 'custody_violation'
  | 'payment_issue'
  | 'other';

/**
 * A single message on a dispute thread (dispute opening statement or reply).
 */
export interface DisputeComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/**
 * A dispute and its comment thread.
 *
 * `body` carries the narrative the author wrote — the value submitted through
 * the `description` field of `disputeFormSchema`.
 */
export interface Dispute {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  status: DisputeStatus;
  reason: DisputeReason;
  comments: DisputeComment[];
}
