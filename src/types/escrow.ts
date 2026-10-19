export type EscrowOnChainStatus = 
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

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

/**
 * The only part of an escrow record the user interface is allowed to see.
 *
 * The API returns the full record, but everything beyond the lifecycle state
 * (keys, secrets, balances, transaction identifiers) is deliberately left out
 * of this projection so it can never be forwarded to a component by accident.
 */
export interface EscrowRecordSummary {
  /**
   * Lifecycle state exactly as reported by the API.
   *
   * Typed as a plain string because the backend may introduce a state the
   * client does not know yet — callers are expected to fall back to a generic
   * label instead of assuming a known value.
   */
  status: string;
  /** Id of the dispute thread raised against this record, when there is one. */
  disputeId?: string | null;
}
