export type EscrowOnChainStatus = 
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

/**
 * Escrow record status codes as returned by the escrow API.
 *
 * Canonical home for the union so `src/lib/statusConfig.ts` can derive an
 * exhaustive badge map from it.
 */
export const ESCROW_STATUSES = [
  "AWAITING_FUNDS",
  "FUNDED",
  "IN_REVIEW",
  "DISPUTED",
  "SETTLED",
  "SETTLEMENT_FAILED",
] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

/**
 * Escrow status codes used by the escrow lifecycle views (progress stepper,
 * settlement card). They are a superset of {@link EscrowStatus} and describe
 * the same lifecycle from a different angle.
 */
export const ESCROW_LIFECYCLE_STATUSES = [
  "CREATED",
  "FUNDED",
  "CONFIRMED",
  "SETTLING",
  "SETTLED",
  "SETTLEMENT_FAILED",
  "DISPUTED",
  "NOT_FOUND",
] as const;

export type EscrowLifecycleStatus = (typeof ESCROW_LIFECYCLE_STATUSES)[number];

export interface SettlementPayment {
  id: string;
  amount: number;
  asset: string;
  destination: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
}

export interface SettlementSummary {
  onChainStatus: EscrowOnChainStatus;
  confirmations: number;
  payments: SettlementPayment[];
  stellarExplorerUrl: string;
}

/**
 * Lifecycle of an escrow record, matching the Prisma `Escrow.status` enum as
 * served by the escrow API (and mirrored by `src/mocks/handlers/escrow.ts`).
 */
export const ESCROW_RECORD_STATUSES = [
  "CREATED",
  "FUNDED",
  "RELEASED",
  "REFUNDED",
  "DISPUTED",
] as const;

export type EscrowRecordStatus = (typeof ESCROW_RECORD_STATUSES)[number];
