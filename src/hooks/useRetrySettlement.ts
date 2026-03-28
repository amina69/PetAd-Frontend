import { useApiMutation } from "./useApiMutation";
import { escrowService } from "../api/escrowService";

/**
 * useRetrySettlement
 *
 * Wraps useApiMutation to retry a failed escrow settlement.
 * Invalidates ["escrow", escrowId] on success so any parent query
 * showing escrow status refreshes automatically.
 */
export function useRetrySettlement(escrowId: string) {
  const { mutate, isPending, isError, error } = useApiMutation<void, string>(
    (id: string) => escrowService.retrySettlement(id),
    {
      invalidates: [["escrow", escrowId]],
    },
  );

  return {
    mutateRetrySettlement: () => mutate(escrowId),
    isPending,
    isError,
    error,
  };
}
