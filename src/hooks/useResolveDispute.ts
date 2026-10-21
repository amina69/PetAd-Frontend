import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveDispute, updateDisputeStatus } from "../api/disputes";
import type { DisputeDetailApiResponse } from "./useDisputeDetail";

interface ResolveDisputeVariables {
  disputeId: string;
  shelterPercent: number;
  adopterPercent: number;
  resolutionNote?: string;
  assignedAdminId?: string;
  status?: "UNDER_REVIEW" | "RESOLVED";
}

export const useResolveDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      disputeId,
      shelterPercent,
      adopterPercent,
      resolutionNote,
      assignedAdminId,
      status,
    }: ResolveDisputeVariables) => {
      if (status === "UNDER_REVIEW" && resolutionNote) {
        return updateDisputeStatus(
          disputeId,
          status,
          resolutionNote,
          assignedAdminId,
        );
      }
      return resolveDispute(
        disputeId,
        shelterPercent,
        adopterPercent,
        resolutionNote,
        assignedAdminId,
      );
    },
    onMutate: async (variables) => {
      const queryKey = ["dispute-detail", variables.disputeId] as const;
      if (!variables.status && !variables.resolutionNote) {
        return { queryKey, previous: undefined };
      }

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DisputeDetailApiResponse>(queryKey);
      if (previous) {
        const status = variables.status ?? "RESOLVED";
        const resolutionNote = variables.resolutionNote?.trim();
        queryClient.setQueryData<DisputeDetailApiResponse>(queryKey, {
          ...previous,
          status,
          ...(resolutionNote
            ? {
                comments: [
                  ...(previous.comments ?? []),
                  {
                    id: `admin-note-${Date.now()}`,
                    authorName: "Admin",
                    content: resolutionNote,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : {}),
        });
      }
      return { queryKey, previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["dispute-detail", variables.disputeId],
      });
      void queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
};