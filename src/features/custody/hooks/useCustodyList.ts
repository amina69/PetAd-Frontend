import { useQuery } from "@tanstack/react-query";
import {
  custodyService,
  type CustodyListParams,
} from "../../../api/custodyService";

/** Query-key factory for the custody domain.

 * - List entries are keyed by `["custody", params]` (per the issue spec): one
 *   cache entry per filter/page combination, all living under the
 *   `["custody"]` root.
 * - Detail entries live under a **separate** root (`["custody-detail", id]`).
 *   Keeping the roots distinct is what lets each mutation invalidate exactly
 *   the keys it affects: `["custody"]` sweeps every list variant without
 *   touching arrangement details, while `["custody-detail", id]` refreshes a
 *   single arrangement without disturbing the list or any other arrangement.
 *
 * Note: the legacy `useCustodyDetails` hook (`src/lib/hooks`) caches the raw
 * detail payload under `["custody-details", id]`; that key is deliberately
 * left out of this feature's invalidations so the escrow-augmented shape here
 * never collides with it.
 */
export const custodyKeys = {
  /** Root of every list cache entry (`["custody"]`). */
  listRoot: ["custody"] as const,
  /** Full list key: `["custody", params]`. */
  list: (params: CustodyListParams = {}) => ["custody", params] as const,
  /** Detail key: `["custody-detail", custodyId]`. */
  detail: (custodyId: string) => ["custody-detail", custodyId] as const,
};

/** useCustodyList — paginated custody arrangements.

 * Mirrors `useApprovalList`: stable `["custody", params]` key per filter set,
 * one-minute stale window, no refetch on window focus. All list entries share
 * the `["custody"]` root so a mutation can invalidate them in a single call.
 */
export function useCustodyList(params: CustodyListParams = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: custodyKeys.list(params),
    queryFn: () => custodyService.getCustodyList(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}