import { useApiQuery } from "./useApiQuery";
import { approvalService, type ApprovalResponse } from "../api/approvalService";

interface UsePendingApprovalsReturn {
  approvalsData: ApprovalResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  isForbidden: boolean;
  pendingCount: number;
}

/**
 * Hook to fetch pending approvals
 * Polls every 5 minutes (300000ms)
 */
export function usePendingApprovals(): UsePendingApprovalsReturn {
  const { data, isLoading, isError, isForbidden } = useApiQuery(
    ["pendingApprovals"],
    () => approvalService.getPendingApprovals(),
    {
      refetchInterval: 5 * 60 * 1000, // 5 minutes
      staleTime: 5 * 60 * 1000,
    },
  );

  return {
    approvalsData: data,
    isLoading,
    isError,
    isForbidden,
    pendingCount: data?.total ?? 0,
  };
}
