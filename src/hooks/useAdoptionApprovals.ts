import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import type { AdoptionApprovalsResponse } from "../types/adoption";

export function useAdoptionApprovals(adoptionId: string) {
  const { data, isLoading, isError } = useApiQuery<AdoptionApprovalsResponse>(
    ["adoption", adoptionId, "approvals"],
    () => adoptionService.getApprovals(adoptionId),
    {
      refetchInterval: (query) => {
        if (query.state.data?.quorumMet) return false;
        return 30_000;
      },
    }
  );

  return {
    required: data?.required ?? 0,
    given: data?.given ?? [],
    pending: data?.pending ?? 0,
    quorumMet: data?.quorumMet ?? false,
    escrowAccountId: data?.escrowAccountId ?? null,
    isLoading,
    isError,
  };
}
