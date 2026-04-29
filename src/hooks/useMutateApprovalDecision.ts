import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "./useApiMutation";
import { adoptionService } from "../api/adoptionService";
import type { ApprovalDecision, DecisionStatus } from "../types/adoption";

export interface ApprovalDecisionVariables {
  decision: DecisionStatus;
  reason: string;
  role: string;
}

/**
 * useMutateApprovalDecision
 * 
 * Mutation hook for submitting an approval or rejection decision.
 * Includes optimistic updates and query invalidation.
 */
export function useMutateApprovalDecision(adoptionId: string) {
  const queryClient = useQueryClient();

  return useApiMutation(
    (variables: ApprovalDecisionVariables) => 
      adoptionService.approveAdoption(adoptionId, { 
        decision: variables.decision, 
        reason: variables.reason 
      }),
    {
      invalidates: [
        ["adoption", adoptionId],
        ["adoption", adoptionId, "approvals"],
        ["adoption", adoptionId, "timeline"],
      ],
      
      onOptimisticUpdate: async (variables) => {
        const queryKey = ["adoption", adoptionId, "approvals"];
        
        // Cancel in-flight queries
        await queryClient.cancelQueries({ queryKey });

        // Snapshot current value
        const previousApprovals = queryClient.getQueryData<ApprovalDecision[]>(queryKey);

        // Optimistically update
        if (previousApprovals) {
          const optimisticDecision: ApprovalDecision = {
            id: `optimistic-${Date.now()}`,
            approverName: "You", // Mocked as 'You' for the current user
            approverRole: variables.role,
            status: variables.decision,
            reason: variables.reason,
            timestamp: new Date().toISOString(),
          };

          queryClient.setQueryData<ApprovalDecision[]>(queryKey, (old) => {
            if (!old) return [optimisticDecision];
            
            // Check if a decision for this role already exists and replace it, or append
            const existingIndex = old.findIndex(d => d.approverRole === variables.role);
            if (existingIndex > -1) {
              const newApprovals = [...old];
              newApprovals[existingIndex] = optimisticDecision;
              return newApprovals;
            }
            return [...old, optimisticDecision];
          });
        }

        return { previousApprovals };
      },

      onRollback: (snapshot: any) => {
        const queryKey = ["adoption", adoptionId, "approvals"];
        if (snapshot?.previousApprovals) {
          queryClient.setQueryData(queryKey, snapshot.previousApprovals);
        }
      },
    }
  );
}
