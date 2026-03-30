import { useEffect, useState } from "react";
import { useApiQuery } from "./useApiQuery";
import { adoptionApprovalsService } from "../api/adoptionApprovalsService";
import type { AdoptionApprovalsState } from "../types/adoption";

interface UseAdoptionApprovalsReturn {
  required: number;
  given: number;
  pending: number;
  quorumMet: boolean;
  escrowAccountId: string;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Hook to fetch the approval state for an adoption
 * Polls every 30 seconds while quorumMet is false
 * Stops polling once quorum is reached
 */
export function useAdoptionApprovals(adoptionId: string): UseAdoptionApprovalsReturn {
  const [refetchInterval, setRefetchInterval] = useState<number | false>(30 * 1000); // 30 seconds

  const { data, isLoading, isError } = useApiQuery<AdoptionApprovalsState>(
    ["adoptionApprovals", adoptionId],
    () => adoptionApprovalsService.getAdoptionApprovals(adoptionId),
    {
      refetchInterval, // Dynamic refetch interval
      staleTime: 30 * 1000, // 30 seconds
      enabled: !!adoptionId,
    },
  );

  // Stop polling once quorum is met
  useEffect(() => {
    if (data?.quorumMet) {
      setRefetchInterval(false); // Disable polling
    }
  }, [data?.quorumMet]);

  return {
    required: data?.required ?? 0,
    given: data?.given ?? 0,
    pending: data?.pending ?? 0,
    quorumMet: data?.quorumMet ?? false,
    escrowAccountId: data?.escrowAccountId ?? "",
    isLoading,
    isError,
  };
}
