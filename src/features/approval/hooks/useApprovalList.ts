import { useQuery } from "@tanstack/react-query";
import { approvalService } from "../api/approvalService";
import type { ApprovalListParams, ApprovalListResponse } from "../types/approval.types";

// ─── Query Key Factory ───────────────────────────────────────────────────────

/**
 * Stable query-key factory for the approvals list.
 * Use `approvalKeys.list(params)` in mutations or manual invalidation to
 * keep cache keys consistent across the app.
 */
export const approvalKeys = {
  all: ["approvals"] as const,
  list: (params: ApprovalListParams) => ["approvals", params] as const,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * TanStack Query hook to retrieve a paginated list of approvals.
 *
 * Filter/pagination changes (e.g. `params.status`, `params.page`) produce a new
 * query key, which triggers an automatic refetch.
 *
 * @param params - Filter and pagination options.
 * @returns The query result including `data`, `isLoading`, `isError`, `error`,
 *   and `refetch`.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useApprovalList({ status: "PENDING", page: 1 });
 * ```
 */
export function useApprovalList(params: ApprovalListParams = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: approvalKeys.list(params),
    queryFn: () => approvalService.getApprovals(params),
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

export type { ApprovalListParams, ApprovalListResponse };
