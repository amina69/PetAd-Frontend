import { useApiMutation } from "../../../hooks/useApiMutation";
import { custodyService } from "../../../api/custodyService";
import type { CustodyArrangement } from "../types/custody";
import { custodyKeys } from "./useCustodyList";

/**
 * useEndCustody — end a custody arrangement before its scheduled end date.
 *
 * Invalidates exactly two keys on success (asserted in the tests):
 *
 * - `["custody"]` — the lists displaying the arrangement's status.
 * - `["custody-detail", custodyId]` — the ended arrangement's detail.
 *
 * Other arrangements' details, escrow caches and unrelated domains stay
 * untouched.
 */
export function useEndCustody(custodyId: string) {
  const mutation = useApiMutation<CustodyArrangement, void>(
    () => custodyService.endCustody(custodyId),
    {
      invalidates: [custodyKeys.listRoot, custodyKeys.detail(custodyId)],
    },
  );

  return {
    endCustody: () => mutation.mutate(),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
