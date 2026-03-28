import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "./useApiMutation";
import {
  disputeService,
  type ResolveDisputePayload,
  type ResolveDisputeResponse,
} from "../api/disputeService";

export interface UseMutateResolveDisputeOptions {
  disputeId: string;
  adoptionId: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useMutateResolveDispute({
  disputeId,
  adoptionId,
  onSuccess,
  onError,
}: UseMutateResolveDisputeOptions) {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, isError, error } = useApiMutation<
    ResolveDisputeResponse,
    ResolveDisputePayload
  >(
    (payload: ResolveDisputePayload) =>
      disputeService.resolveDispute(disputeId, payload),
    {
      invalidates: [
        ["dispute", disputeId],
        ["adoption", adoptionId],
      ],
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["dispute", disputeId] });
        queryClient.invalidateQueries({ queryKey: ["adoption", adoptionId] });
        onSuccess?.();
      },
      onSettled: (_data, err) => {
        if (err) {
          onError?.(err.message ?? "Failed to resolve dispute");
        }
      },
    },
  );

  return {
    mutateResolveDispute: mutate,
    mutateResolveDisputeAsync: mutateAsync,
    isPending,
    isError,
    error,
  };
}