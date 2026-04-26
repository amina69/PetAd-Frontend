import { useMemo } from "react";
import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import type { ApprovalDecision } from "../types/adoption";

export interface UseAdoptionApprovalsReturn {
  required: string[];
  given: ApprovalDecision[];
  pending: string[];
  isLoading: boolean;
  isError: boolean;
}

/**
 * useAdoptionApprovals
 * 
 * Orchestrates the approval state for a multi-party adoption process.
 * Returns the required roles, the decisions already given, and the roles still pending.
 */
export function useAdoptionApprovals(adoptionId: string): UseAdoptionApprovalsReturn {
  const { data: given = [], isLoading, isError } = useApiQuery<ApprovalDecision[]>(
    ["adoption", adoptionId, "approvals"],
    () => adoptionService.getApprovals(adoptionId),
    { enabled: !!adoptionId }
  );

  // In a real app, these might come from an adoption template or another endpoint
  const required = useMemo(() => ["Shelter", "Admin", "Veterinary Inspector"], []);

  const pending = useMemo(() => {
    const givenRoles = given.map(d => d.approverRole);
    return required.filter(role => !givenRoles.includes(role));
  }, [required, given]);

  return {
    required,
    given,
    pending,
    isLoading,
    isError,
  };
}
