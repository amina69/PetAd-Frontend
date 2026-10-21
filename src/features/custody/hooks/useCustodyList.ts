import { useQuery } from "@tanstack/react-query";
import {
  custodyService,
  type CustodyListParams,
} from "../../../api/custodyService";

// ─── Query Key Factory ───────────────────────────────────────────────────────

/**
 * Stable query-key factory for the Temporary Custody domain.
 *
 * - **List** entries are keyed by `["custody", params]` — one cache entry per
 *   filter/page combination, all living under the `["custody"]` root.
 * - **Detail** entries live under a *separate* root (`["custody-detail", id]`).
 *
 * Keeping the two roots apart is what allows every mutation to invalidate
 * **exactly** the keys it affects:
 *
 * - `["custody"]` sweeps every list variant (a new/updated arrangement changes
 *   whatever list the user is looking at) without touching any arrangement
 *   detail;
 * - `["custody-detail", id]` refreshes a single arrangement without
 *   disturbing the lists or any other arrangement.
 *
 * Note: the legacy `useCustodyDetails` hook (`src/lib/hooks`) caches the raw
 * detail payload under `["custody-details", id]`. That key is deliberately
 * left out of this feature's invalidations so the escrow-augmented shape
 * cached here never collides with it.
 */
export const custodyKeys = {
  /** Root of every list cache entry (`["custody"]`). */
  listRoot: ["custody"] as const,
  /** Full list key: `["custody", params]`. */
  list: (params: CustodyListParams = {}) => ["custody", params] as const,
  /** Detail key: `["custody-detail", custodyId]`. */
  detail: (custodyId: string) => ["custody-detail", custodyId] as const,
  /**
   * Availability key: `["custody", "availability", petId]`.
   *
   * The days a pet cannot be booked for change whenever an arrangement
   * changes, so the entry deliberately lives under the list root and is
   * refreshed by the same invalidation.
   */
  availability: (petId: string) => ["custody", "availability", petId] as const,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * TanStack Query hook to retrieve the list of temporary custody arrangements.
 *
 * Filter/pagination changes (e.g. `params.status`, `params.page`) produce a new
 * query key, which triggers an automatic refetch.
 *
 * @param params - Filter and pagination options.
 * @returns The query result including `data`, `isLoading`, `isError`, `error`
 *   and `refetch`.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCustodyList({ status: "active", page: 1 });
 * ```
 */
export function useCustodyList(params: CustodyListParams = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: custodyKeys.list(params),
    queryFn: () => custodyService.getCustodyList(params),
    // Arrangements only change when somebody acts on them, so avoid
    // refetching on every render / window focus.
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

export type { CustodyListParams };
