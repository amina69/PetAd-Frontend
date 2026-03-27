import { useApiQuery } from "./useApiQuery";

// On-chain enrichment extends the existing dispute shape
export interface DisputeOnChain {
  escrowOnChainStatus: string;
  stellarExplorerUrl: string;
  resolutionTxHash: string | null;
}

export interface DisputeDetail extends DisputeOnChain {
  id: string;
  adoptionId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: "open" | "under_review" | "resolved" | "closed";
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useDisputeDetail(disputeId: string) {
  return useApiQuery<DisputeDetail>(
    ["dispute", disputeId],
    async () => {
      const res = await fetch(`/api/disputes/${disputeId}`);
      if (!res.ok) {
        const err = await res.json();
        throw Object.assign(new Error(err.message), { status: res.status });
      }
      return res.json();
    },
  );
}