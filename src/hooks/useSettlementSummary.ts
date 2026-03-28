import { useApiQuery } from "./useApiQuery";
import { escrowService } from "../api/escrowService";
import type { SettlementSummary } from "../types/escrow";

export function useSettlementSummary(escrowId: string) {
  return useApiQuery<SettlementSummary>(
    ["escrow", escrowId, "settlement-summary"],
    () => escrowService.getSettlementSummary(escrowId),
    {
      enabled: !!escrowId,
    }
  );
}
