import { useApiMutation } from "./useApiMutation";
import { escrowService } from "../api/escrowService";
import { queryKeys } from "../lib/queryKeys";

/**
 * useRetrySettlement
 *
 * Wraps useApiMutation to retry a failed escrow settlement.
 * Invalidates the escrow detail query on success so any parent query
 * showing escrow status refreshes automatically.
 */
export function useRetrySettlement(escrowId: string) {
  const { mutate, isPending, isError, error } = useApiMutation<void, string>(
    (id: string) => escrowService.retrySettlement(id),
    {
      invalidates: [queryKeys.escrow.detail(escrowId)],
    },
  );

  return {
    mutateRetrySettlement: () => mutate(escrowId),
    isPending,
    isError,
    error,
  };
}
