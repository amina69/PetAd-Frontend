import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type DecisionPayload = {
  decision: "approved" | "rejected";
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
      await queryClient.cancelQueries({ queryKey: ["approvals", adoptionId] });

      const previousApprovals = queryClient.getQueryData([
        "approvals",
        adoptionId,
      ]);

      queryClient.setQueryData(["approvals", adoptionId], (old: any) => {
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
          ["approvals", adoptionId],
          context.previousApprovals
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adoption", adoptionId] });
      queryClient.invalidateQueries({ queryKey: ["approvals", adoptionId] });
      queryClient.invalidateQueries({ queryKey: ["timeline", adoptionId] });
    },
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};