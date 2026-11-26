import { useQuery } from "@tanstack/react-query";
import { custodyService } from "../../../api/custodyService";
import { escrowService } from "../../../api/escrowService";
import type { CustodyDetails } from "../../../types/adoption";
import type { EscrowStatusResponse } from "../../../lib/hooks/useEscrowStatus";
import { custodyKeys } from "./useCustodyList";

/** Custody detail plus the escrow snapshot fetched alongside it. */
export interface CustodyDetailWithEscrow extends CustodyDetails {
  /** Escrow state as reported by `GET /escrow/:id/status`, or `null` when the
   * arrangement has no escrow. Always server-sourced — never derived from
   * `CustodyDetails.status` client-side. */
  escrow: EscrowStatusResponse | null;
}

/** useCustodyDetail — a single custody arrangement with its escrow snapshot.

 * The escrow payload is fetched from the existing escrow endpoint inside the
 * same cache entry `["custody-detail", custodyId]`, so invalidating the
 * detail key refreshes custody data and escrow data together. No request is
 * made until a `custodyId` is provided.
 */
export function useCustodyDetail(custodyId: string | undefined) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: custodyKeys.detail(custodyId ?? ""),
    queryFn: async (): Promise<CustodyDetailWithEscrow> => {
      const detail = await custodyService.getDetails(custodyId!);
      const escrow = detail.escrowId
        ? await escrowService.getStatus(detail.escrowId)
        : null;
      return { ...detail, escrow };
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