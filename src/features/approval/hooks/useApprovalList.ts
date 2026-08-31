import { useQuery } from "@tanstack/react-query";
import { approvalService } from "../api/approvalService";
import type { ApprovalListParams, ApprovalListResponse } from "../types/approval.types";

/**
 * useApprovalList
 *
 * TanStack Query hook to retrieve a list of approvals based on filter and pagination params.
 * Updates query keys automatically when `params.status` or `params.page` change.
 */
export function useApprovalList(params: ApprovalListParams = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["approvals", params],
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
