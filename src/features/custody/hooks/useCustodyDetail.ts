import { useQuery } from "@tanstack/react-query";
import { custodyService } from "../../../api/custodyService";
import { escrowService } from "../../../api/escrowService";
import type { EscrowStatusResponse } from "../../../lib/hooks/useEscrowStatus";
import type { CustodyArrangement } from "../types/custody";
import { custodyKeys } from "./useCustodyList";

/** A custody arrangement together with the escrow snapshot read alongside it. */
export interface CustodyDetailWithEscrow extends CustodyArrangement {
  /**
   * Live escrow state as reported by the escrow endpoint, or `null` when the
   * arrangement has no escrow record yet.
   *
   * This is always **server-sourced** — the escrow status is never derived
   * client-side from `status`/`escrowStatus`.
   */
  escrow: EscrowStatusResponse | null;
}

/**
 * Resolves the escrow id to read for an arrangement.
 *
 * The API may expose an explicit `escrowId`; when it does not, the
 * arrangement id doubles as the escrow id (the same convention the settlement
 * summary page already uses for adoptions).
 */
function resolveEscrowId(arrangement: CustodyArrangement): string {
  return arrangement.escrowId ?? arrangement.id;
}

/**
 * Reads the escrow snapshot for an arrangement.
 *
 * A missing escrow (404) is not an error for the custody detail: the
 * arrangement itself is still perfectly valid, so the escrow is reported as
 * `null` and the custody data is still returned.
 */
async function fetchEscrowSnapshot(
  arrangement: CustodyArrangement,
): Promise<EscrowStatusResponse | null> {
  try {
    return await escrowService.getStatus(resolveEscrowId(arrangement));
  } catch {
    // No escrow record for this arrangement (or the escrow service is down) —
    // the custody detail must still render.
    return null;
  }
}

/**
 * TanStack Query hook to read a single custody arrangement.
 *
 * The escrow snapshot is fetched **alongside** the arrangement from the
 * existing escrow endpoint and stored in the same cache entry
 * (`["custody-detail", custodyId]`), so invalidating the detail key refreshes
 * the custody data and the escrow data together.
 *
 * No request is made until a `custodyId` is provided.
 *
 * @param custodyId - Id of the arrangement to read.
 */
export function useCustodyDetail(custodyId: string | undefined) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: custodyKeys.detail(custodyId ?? ""),
    queryFn: async (): Promise<CustodyDetailWithEscrow> => {
      const arrangement = await custodyService.getCustodyById(custodyId!);
      const escrow = await fetchEscrowSnapshot(arrangement);

      return { ...arrangement, escrow };
    },
    enabled: Boolean(custodyId),
    staleTime: 30_000,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export type { EscrowStatusResponse };
