export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'CLOSED'
  | 'SLA_BREACHED';

/**
 * Reason a dispute was filed.
 * @see https://github.com/amina69/PetAd-Frontend/issues/450
 */
export type DisputeReason =
  | 'pet_condition'
  | 'custody_violation'
  | 'payment_issue'
  | 'other';

/**
 * A single comment on a dispute thread.
 * @see https://github.com/amina69/PetAd-Frontend/issues/450
 */
export interface DisputeComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/**
 * Full dispute record used across B3–B10.
 * Types must be used consistently — no parallel shape definitions.
 * @see https://github.com/amina69/PetAd-Frontend/issues/450
 */
export interface DisputeRecord {
  id: string;
  adoptionOrCustodyId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  filedBy: string;
  filedAt: string;
  resolvedAt: string | null;
  comments: DisputeComment[];
}

// Issues Implemented