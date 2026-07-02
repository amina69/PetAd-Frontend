import { useApiQuery } from "./useApiQuery";
import { useRoleGuard } from "./useRoleGuard";
import { apiClient } from "../lib/api-client";

const POLL_INTERVAL_MS = 300_000;
const MAX_DISPLAY = 9;

interface PendingApprovalsResponse {
  count?: number;
  total?: number;
}

export function usePendingApprovalsCount() {
  const { canApprove } = useRoleGuard();

  const query = useApiQuery<PendingApprovalsResponse>(
    ["pending-approvals-count"],
    () =>
      apiClient.get<PendingApprovalsResponse>(
        "/shelter/approvals?status=PENDING&limit=0",
      ),
    {
      enabled: canApprove,
      refetchInterval: POLL_INTERVAL_MS,
      refetchIntervalInBackground: true,
      staleTime: 0,
    },
  );

  const count = query.data?.count ?? query.data?.total ?? 0;

  return {
    count,
    displayCount: count > MAX_DISPLAY ? `${MAX_DISPLAY}+` : String(count),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
