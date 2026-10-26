import { useApiQuery } from "./useApiQuery";
import { escrowService } from "../api/escrowService";
import type { SettlementSummary } from "../types/escrow";
import { STALE_TIME } from "../lib/staleTime";

export function useSettlementSummary(escrowId: string) {
  return useApiQuery<SettlementSummary>(
    ["escrow", escrowId, "settlement-summary"],
    () => escrowService.getSettlementSummary(escrowId),
    {
      enabled: !!escrowId,
      // Settlement figures are final once computed, so a short cache avoids refetch on tab switches.
      staleTime: STALE_TIME.TIMELINES,
    }
  );
}
