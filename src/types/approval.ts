/**
 * Canonical approval status codes.
 *
 * The approval domain talks to the backend in a couple of different shapes
 * (request lists, decision records, admin filters). Keeping the codes in one
 * place lets `src/lib/statusConfig.ts` derive an exhaustive union, so adding a
 * new status anywhere fails the type-check until a badge entry exists for it.
 */
export const APPROVAL_STATUS_CODES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "DISPUTED",
  "SHELTER_APPROVED",
  "ADMIN_APPROVED",
] as const;

export type ApprovalStatusCode = (typeof APPROVAL_STATUS_CODES)[number];

/**
 * Lowercase approval status codes used by the approval request list.
 *
 * Kept next to the canonical codes so `src/lib/statusConfig.ts` can map them
 * onto the same badge entries.
 */
export type ApprovalStatus = "pending" | "approved" | "rejected";
