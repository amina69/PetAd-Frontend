import { useQueryClient } from "@tanstack/react-query";
import { adoptionService } from "../api/adoptionService";
import { useApiMutation } from "./useApiMutation";
import type { ApprovalDecisionPayload, ApprovalItem } from "../types/adoption";

/**
 * Mutation hook for submitting an approval or rejection decision.
 * 
 * Includes optimistic update for the approval list and cache invalidation
 * for adoption details, approvals, and the escrow timeline.
 * 
 * @param adoptionId - The ID of the adoption request to approve/reject
 */
export function useMutateApprovalDecision(adoptionId: string) {
  const queryClient = useQueryClient();

  return useApiMutation(
    (payload: ApprovalDecisionPayload) => 
      adoptionService.approveAdoption(adoptionId, payload),
    {
      // Invalidate relevant queries on success
      invalidates: [
        ["adoption", adoptionId],
        ["approvals", adoptionId],
        ["escrow-timeline", adoptionId],
      ],

      // Optimistic update: Mark a pending approval as approved/rejected
      onOptimisticUpdate: async (variables) => {
        const queryKey = ["approvals", adoptionId];
        
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey });

        // Snapshot current state
        const previousApprovals = queryClient.getQueryData<ApprovalItem[]>(queryKey);

        // Optimistically update the list
        if (previousApprovals) {
          queryClient.setQueryData<ApprovalItem[]>(queryKey, (old) => {
            if (!old) return [];
            
            // Find the first pending item and update it
            // In a real app, we'd probably match by current user ID
            const index = old.findIndex(item => item.decision === "pending");
            if (index === -1) return old;

            const newApprovals = [...old];
            newApprovals[index] = {
              ...newApprovals[index],
              decision: variables.decision === "approve" ? "approve" : "reject",
              notes: variables.reason ?? null,
              resolvedAt: new Date().toISOString(),
            };
            return newApprovals;
          });
        }

        return previousApprovals;
      },

      // Rollback on error
      onRollback: (snapshot) => {
        queryClient.setQueryData(["approvals", adoptionId], snapshot);
      },
    }
  );
}
