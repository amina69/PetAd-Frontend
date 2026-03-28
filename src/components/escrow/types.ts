export const ESCROW_STATUSES = [
  "AWAITING_FUNDS",
  "FUNDED",
  "IN_REVIEW",
  "DISPUTED",
  "SETTLED",
  "SETTLEMENT_FAILED",
] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

export interface EscrowStatusData {
  escrowId: string;
  adoptionId: string;
  petName: string;
  status: EscrowStatus;
  amount: number;
  currency?: string;
  fundedAt?: string;
  settledAt?: string;
  failureReason?: string;
  txHash?: string;
}

export interface SettlementSummary {
  status: EscrowStatus;
  headline: string;
  description: string;
  escrow: EscrowStatusData;
}

export function formatAmount(amount: number, currency = "USDC") {
  return `${currency} ${amount.toFixed(2)}`;
}
