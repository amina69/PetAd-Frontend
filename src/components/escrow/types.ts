
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
  balance?: string | number;
  disputeId?: string;
  disputeRaisedAt?: string;
}

export interface SettlementSummary {
  status: EscrowStatus;
  headline: string;
  description: string;
  escrow: EscrowStatusData;
}

export interface EscrowStatusCardProps {
  escrowId: string;
  initialData?: EscrowStatusData;
  fetchStatus?: () => Promise<EscrowStatusData>;
  pollingIntervalMs?: number;
}

export interface SettlementSummaryPageProps {
  summary?: SettlementSummary;
  onComplete?: () => void;
  isAdmin?: boolean;
}

/**
 * Map the API-level on-chain status to the EscrowStatus union that
 * EscrowStatusBadge understands.
 */
export const ON_CHAIN_TO_ESCROW_STATUS: Record<string, EscrowStatus> = {
  PENDING:  "IN_REVIEW",
  SUCCESS:  "SETTLED",
  FAILED:   "SETTLEMENT_FAILED",
};

export function formatAmount(amount: number, currency = "USDC") {
  return `${currency} ${amount.toFixed(2)}`;
}

export function getEscrowFundedBannerStorageKey(escrowId: string) {
  return `escrow-funded-banner-dismissed:${escrowId}`;
}
