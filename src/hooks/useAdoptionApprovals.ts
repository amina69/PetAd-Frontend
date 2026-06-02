import { useState } from "react";
import { adoptionService } from "../api/adoptionService";
import type { AdoptionApprovalsResponse } from "../types/adoption";
import { useApiQuery } from "./useApiQuery";
import { useMutateApprovalDecision } from "./useMutateApprovalDecision";
import { useRoleGuard } from "./useRoleGuard";

export function useAdoptionApprovals(adoptionId: string) {
  const { role } = useRoleGuard();
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

  const mutation = useMutateApprovalDecision(adoptionId);
  const [quorumMet, setQuorumMet] = useState(false);

  // Check if current user has already made a decision
  const hasDecided = (data?.given ?? []).some(
    (decision) => decision.approverRole === role || decision.approverName === role
  );

  // For now, return empty array - this may need to come from API in future
  const requiredRoles: string[] = [];

  const mutateApprovalDecision = async () => {
    // Default decision type - can be extended to support both approve and reject
    return mutation.mutateAsync({ decision: "approved" });
  };

  return {
    required: data?.required ?? 0,
    given: data?.given ?? [],
    pending: data?.pending ?? 0,
    quorumMet: (quorumMet || data?.quorumMet) ?? false,
    escrowAccountId: data?.escrowAccountId ?? null,
    isLoading,
    isError,
    hasDecided,
    requiredRoles,
    mutateApprovalDecision,
    isPending: mutation.isPending,
    setQuorumMet,
  };
}
