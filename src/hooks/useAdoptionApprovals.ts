import { useApiQuery } from "./useApiQuery";
import { apiClient } from "../lib/api-client";

interface AdoptionApprovalsApiResponse {
  required: number;
  given: number;
  quorumMet: boolean;
  escrowAccountId: string | null;
}

export interface AdoptionApprovalsResult {
  required: number;
  given: number;
  pending: number;
  quorumMet: boolean;
  escrowAccountId: string | null;
  isLoading: boolean;
  isError: boolean;
}

const POLL_INTERVAL_MS = 30_000; // 30 seconds

/**
 * useAdoptionApprovals
 *
 * Fetches and polls adoption approval state. Polls every 30 seconds while
 * quorum is not met, and stops polling permanently once quorum is reached.
 *
 * @param adoptionId - The adoption ID to fetch approvals for
 * @returns Approval state including required, given, pending counts and quorum status
 */
export function useAdoptionApprovals(adoptionId: string): AdoptionApprovalsResult {
  const result = useApiQuery<AdoptionApprovalsApiResponse>(
    ["adoptionApprovals", adoptionId],
    () => apiClient.get(`/adoption/${adoptionId}/approvals`),
    {
      enabled: Boolean(adoptionId),
      refetchInterval: (query) => {
        const data = query.state.data;
        // Stop polling once quorum is met
        if (data?.quorumMet) {
          return false;
        }
        return POLL_INTERVAL_MS;
      },
      select: (data) => ({
        required: data.required,
        given: data.given,
        pending: data.required - data.given,
        quorumMet: data.quorumMet,
        escrowAccountId: data.escrowAccountId,
        isLoading: false,
        isError: false,
      }),
    }
  );

  // Transform the result to match the expected return type
  if (result.data) {
    return {
      ...result.data,
      isLoading: result.isLoading,
      isError: result.isError,
    };
  }

  // Return default values when no data is available yet
  return {
    required: 0,
    given: 0,
    pending: 0,
    quorumMet: false,
    escrowAccountId: null,
    isLoading: result.isLoading,
    isError: result.isError,
  };
}
