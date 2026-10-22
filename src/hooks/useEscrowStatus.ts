import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import type { AdoptionDetails, AdoptionStatus } from "../types/adoption";
import { STALE_TIME } from "../lib/staleTime";

const SETTLED_STATUSES: AdoptionStatus[] = ["COMPLETED", "CANCELLED", "FUNDS_RELEASED"];
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
      // Escrow status drives the stepper and is polled until settled, so never serve it stale.
      staleTime: STALE_TIME.NOTIFICATIONS,
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
