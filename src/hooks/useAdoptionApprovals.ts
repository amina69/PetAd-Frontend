import { useState, type Dispatch, type SetStateAction } from "react";
import { adoptionService } from "../api/adoptionService";
import type { AdoptionApprovalsResponse, ApprovalDecision } from "../types/adoption";
import { useApiQuery } from "./useApiQuery";
import { useMutateApprovalDecision } from "./useMutateApprovalDecision";

export interface AdoptionApprovalsHookResult {
  required: number;
  given: ApprovalDecision[];
  pending: number;
  quorumMet: boolean;
  escrowAccountId: string | null;
  isLoading: boolean;
  isError: boolean;
  hasDecided: boolean;
  requiredRoles: string[];
  mutateApprovalDecision: (payload: {
    decision: "approved" | "rejected";
    reason?: string;
  }) => Promise<unknown>;
  isPending: boolean;
  setQuorumMet: Dispatch<SetStateAction<boolean>>;
}

export function useAdoptionApprovals(adoptionId: string): AdoptionApprovalsHookResult {
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
  const hasDecided = false;

  const requiredRoles: string[] = data?.requiredRoles ?? ["admin"];

  const mutateApprovalDecision = async (payload: {
    decision: "approved" | "rejected";
    reason?: string;
  }) => {
    return mutation.mutateAsync(payload);
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
