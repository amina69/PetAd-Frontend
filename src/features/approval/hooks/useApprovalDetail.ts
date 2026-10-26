import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { approvalService } from "../api/approvalService";
import type { ApprovalItem, ApprovalListResponse } from "../types/approval.types";
import { approvalKeys } from "./useApprovalList";

// ─── Cache seeding ───────────────────────────────────────────────────────────

/**
 * Scans every cached approvals list page (`["approvals", <params>]`) and
 * returns the row whose `id` matches, so a detail view can render immediately
 * instead of flashing a loading state.
 *
 * The `["approvals"]` root also matches detail entries and other legacy
 * payloads stored under this feature (e.g. `["approvals", adoptionId]`), so
 * entries that do not expose a list-shaped `items` array are skipped.
 *
 * @param queryClient - The client owning the cache the list hook populated.
 * @param id - The approval id being opened, if any.
 * @returns The matching cached row, or `undefined` when no list page holds it.
 */
function findCachedApprovalItem(
  queryClient: QueryClient,
  id?: string,
): ApprovalItem | undefined {
  if (!id) {
    return undefined;
  }

  const cachedListPages = queryClient.getQueriesData<ApprovalListResponse>({
    queryKey: approvalKeys.all,
  });

  for (const [, page] of cachedListPages) {
    if (!page || !Array.isArray(page.items)) {
      continue;
    }

    const match = page.items.find((item) => item?.id === id);
    if (match) {
      return match;
    }
  }

  return undefined;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * TanStack Query hook to retrieve a single approval by id.
 *
 * - `queryKey`: `["approvals", id]` — shares the `["approvals"]` root with the
 *   list so one `invalidateQueries({ queryKey: approvalKeys.all })` refreshes
 *   both.
 * - `enabled: !!id` — no request is issued while the id is missing.
 * - `initialData` — seeded from any cached list page that already contains the
 *   id, so opening a detail view from the list renders without a loading state.
 *   The seed is stamped with `initialDataUpdatedAt: 0` so it is treated as a
 *   placeholder: the authoritative detail payload is revalidated immediately,
 *   even when the app-wide `staleTime` would otherwise keep it fresh.
 *
 * @param id - The approval id to load. Pass `undefined` to disable the query.
 * @returns The full query result (`data`, `isLoading`, `isError`, `error`,
 *   `isFetching`, `refetch`, …).
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useApprovalDetail(approvalId);
 * ```
 */
export function useApprovalDetail(id?: string) {
  const queryClient = useQueryClient();

  return useQuery<ApprovalItem>({
    queryKey: approvalKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) {
        // Defensive only: `enabled: !!id` keeps this query idle without an id.
        throw new Error("useApprovalDetail requires an approval id");
      }
      return approvalService.getApprovalById(id);
    },
    initialData: () => findCachedApprovalItem(queryClient, id),
    initialDataUpdatedAt: 0,
  });
}
