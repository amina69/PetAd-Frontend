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
