import {
  useMutation,
  useQueryClient,
  type MutationFunction,
  type QueryKey,
} from "@tanstack/react-query";
import { ApiError } from "../lib/api-errors";

export interface UseApiMutationOptions<TData, TVariables> {
  /**
   * Called before the mutation fires. Return the optimistic snapshot
   * to be passed to onRollback if the mutation fails.
   */
  onOptimisticUpdate?: (variables: TVariables) => Promise<unknown> | unknown;

  /**
   * Called on error. Receives the snapshot returned by onOptimisticUpdate
   * so you can restore previous cache state.
   */
  onRollback?: (snapshot: unknown, error: ApiError) => void;

  /**
   * Query keys whose cache entries should be invalidated on a successful
   * mutation. Each element is either a full key array or a single-segment
   * key that React Query will match with its default partial-matching logic.
   */
  invalidates?: QueryKey[];

  /**
   * Called after a successful mutation, before invalidation runs.
   */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /**
   * Called when the mutation settles (success or error).
   */
  onSettled?: (
    data: TData | undefined,
    error: ApiError | null,
    variables: TVariables,
  ) => void;
}

export interface UseApiMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isPending: boolean;
  isError: boolean;
  error: ApiError | null;
}

/**
 * A thin wrapper around useMutation with a consistent optimistic-update
 * and rollback pattern.
 *
 * Flow:
 *  1. onMutate  – cancel in-flight queries, snapshot cache, call
 *                 onOptimisticUpdate so the caller can apply optimistic state.
 *  2. onError   – restore snapshot via onRollback.
 *  3. onSuccess – invalidate every query listed in options.invalidates[].
 *
 * @example
 * const { mutate, isPending } = useApiMutation(
 *   (data: CreatePetPayload) => petService.create(data),
 *   {
 *     invalidates: [['pets']],
 *     onOptimisticUpdate: (variables) => {
 *       const prev = queryClient.getQueryData(['pets']);
 *       queryClient.setQueryData(['pets'], old => [...(old ?? []), variables]);
 *       return prev; // snapshot
 *     },
 *     onRollback: (snapshot) => {
 *       queryClient.setQueryData(['pets'], snapshot);
 *     },
 *   }
 * );
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: UseApiMutationOptions<TData, TVariables>,
): UseApiMutationReturn<TData, TVariables> {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, isError, error } = useMutation<
    TData,
    ApiError,
    TVariables,
    { snapshot: unknown }
  >({
    mutationFn,

    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic state
      if (options?.invalidates?.length) {
        await Promise.all(
          options.invalidates.map((key) =>
            queryClient.cancelQueries({ queryKey: key }),
          ),
        );
      }

      // Let the caller apply optimistic state and capture a rollback snapshot
      const snapshot = options?.onOptimisticUpdate
        ? await options.onOptimisticUpdate(variables)
        : undefined;

      return { snapshot };
    },

    onError: (error, _variables, context) => {
      // Restore previous cache state via caller-supplied rollback handler
      if (options?.onRollback && context !== undefined) {
        options.onRollback(context.snapshot, error);
      }
    },

    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);

      // Invalidate every affected query key
      if (options?.invalidates?.length) {
        options.invalidates.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },

    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables);
    },
  });

  return {
    mutate,
    mutateAsync,
    isPending,
    isError,
    error: error ?? null,
  };
}
