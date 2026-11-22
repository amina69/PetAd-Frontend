import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { queryKeys } from "../lib/queryKeys";
import type { ApprovalStatus } from "../features/approval";

type DecisionPayload = {
  decision: Exclude<ApprovalStatus, "pending">;
  reason?: string;
};

export const useMutateApprovalDecision = (adoptionId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ decision, reason }: DecisionPayload) => {
      const res = await axios.post(
        `/adoption/${adoptionId}/approve`,
        { decision, reason }
      );
      return res.data;
    },

    onMutate: async (newDecision) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.approvals.detail(adoptionId) });

      const previousApprovals = queryClient.getQueryData(
        queryKeys.approvals.detail(adoptionId),
      );

      queryClient.setQueryData(queryKeys.approvals.detail(adoptionId), (old: any) => {
        if (!old) return old;

        return old.map((approver: any) => {
          if (approver.isCurrentUser) {
            return {
              ...approver,
              decision: newDecision.decision,
              status: newDecision.decision,
            };
          }
          return approver;
        });
      });

      return { previousApprovals };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousApprovals) {
        queryClient.setQueryData(
          queryKeys.approvals.detail(adoptionId),
          context.previousApprovals
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adoptions.detail(adoptionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.detail(adoptionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline.detail(adoptionId) });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};