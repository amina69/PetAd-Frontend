import { useApiMutation } from "../../../hooks/useApiMutation";
import { custodyService } from "../../../api/custodyService";
import type { CustodyArrangement } from "../types";
import { custodyKeys } from "./useCustodyList";

/** useEndCustody — end an arrangement before its scheduled end date.

 * Invalidates exactly two keys on success (asserted in tests):
 * - `["custody"]` — lists displaying the arrangement's status.
 * - `["custody-detail", custodyId]` — the ended arrangement's detail.
 *
 * Other arrangements' details and unrelated caches stay untouched.
 */
export function useEndCustody(custodyId: string) {
  const mutation = useApiMutation<CustodyArrangement, void>(
    () => custodyService.endCustody(custodyId),
    {
      invalidates: [custodyKeys.listRoot, custodyKeys.detail(custodyId)],
    }
  );

  return {
    endCustody: () => mutation.mutate(),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
