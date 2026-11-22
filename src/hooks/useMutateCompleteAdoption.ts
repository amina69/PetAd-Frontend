import { useApiMutation } from "./useApiMutation";
import { useQueryClient } from "@tanstack/react-query";
import { adoptionService } from "../api/adoptionService";
import type { AdoptionDetails } from "../types/adoption";
import { queryKeys } from "../lib/queryKeys";

/**
 * useMutateCompleteAdoption
 *
 * Triggers settlement for an escrow-funded adoption.
 *
 * Implements optimistic update pattern:
 * 1. onMutate → snapshots cache, applies SETTLEMENT_TRIGGERED status
 * 2. onError  → rolls back to previous snapshot
 * 3. onSuccess → invalidates adoption query to refetch fresh state
 */
export function useMutateCompleteAdoption(adoptionId: string) {
    const queryClient = useQueryClient();

    const { mutate, isPending, isError, error } = useApiMutation<void, string>(
        (id: string) => adoptionService.completeAdoption(id),
        {
            invalidates: [queryKeys.adoptions.detail(adoptionId)],
            onOptimisticUpdate: () => {
                // Snapshot current cache for potential rollback
                const previousData = queryClient.getQueryData<AdoptionDetails>(
                    queryKeys.adoptions.detail(adoptionId),
                );

                // Apply optimistic update: SETTLEMENT_TRIGGERED status
                queryClient.setQueryData<AdoptionDetails>(
                    queryKeys.adoptions.detail(adoptionId),
                    (old) =>
                        old
                            ? { ...old, status: "SETTLEMENT_TRIGGERED" as const }
                            : old,
                );

                return previousData;
            },
            onRollback: (snapshot) => {
                // Restore previous cache state on error
                if (snapshot !== undefined) {
                    queryClient.setQueryData<AdoptionDetails>(
                        queryKeys.adoptions.detail(adoptionId),
                        snapshot as AdoptionDetails | undefined,
                    );
                }
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: queryKeys.adoptions.detail(adoptionId) });
            },
        },
    );

    return {
        mutateCompleteAdoption: () => mutate(adoptionId),
        isPending,
        isError,
        error,
    };
}