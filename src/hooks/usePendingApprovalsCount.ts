import { useApiQuery } from "./useApiQuery";
import { shelterService } from "../api/shelterService";

/**
 * Hook to fetch and poll pending approvals count for SHELTER and ADMIN roles.
 * 
 * Features:
 * - Polls every 5 minutes (300,000ms)
 * - Only fetches if user has SHELTER or ADMIN role
 * - Returns count, loading state, and error state
 */
export const usePendingApprovalsCount = (userRole: string | null) => {
  const isAuthorized = userRole === "admin" || userRole === "shelter";

  const { data, isLoading, isError } = useApiQuery(
    ["shelter", "approvals", "pending-count"],
    () => shelterService.getPendingApprovalsCount(),
    {
      enabled: isAuthorized,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
      refetchOnWindowFocus: true, // Refresh when user returns to tab
    }
  );

  return {
    count: data?.count ?? 0,
    isLoading,
    isError,
  };
};