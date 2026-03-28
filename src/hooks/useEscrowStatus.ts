import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import type { AdoptionDetails, AdoptionStatus } from "../types/adoption";

const SETTLED_STATUSES: AdoptionStatus[] = ["COMPLETED", "CANCELLED"];
const POLL_INTERVAL_MS = 3_000;

/**
 * useEscrowStatus
 *
 * Polls the adoption details endpoint every 3 s to track escrow-related
 * status transitions. Polling stops automatically once the adoption reaches
 * a terminal state (COMPLETED or CANCELLED — i.e. "settled").
 */
export function useEscrowStatus(adoptionId: string) {
  const result = useApiQuery<AdoptionDetails>(
    ["adoption", adoptionId],
    () => adoptionService.getDetails(adoptionId),
    {
      enabled: !!adoptionId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status && SETTLED_STATUSES.includes(status)) {
          return false;
        }
        return POLL_INTERVAL_MS;
      },
    },
  );

  const isSettled =
    !!result.data?.status && SETTLED_STATUSES.includes(result.data.status);

  return {
    ...result,
    isSettled,
  };
}
