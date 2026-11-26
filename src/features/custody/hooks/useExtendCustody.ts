import { useApiMutation } from "../../../hooks/useApiMutation";
import { custodyService } from "../../../api/custodyService";
import type { CustodyArrangement } from "../types";
import { custodyKeys } from "./useCustodyList";

/** Payload for extending an existing custody arrangement's end date. */
export interface ExtendCustodyPayload {
  /** New end date for the arrangement (ISO 8601). */
  endDate: string;
}

/** useExtendCustody — extend an arrangement's end date.

 * Invalidates exactly two keys on success (asserted in tests):
 * - `["custody"]` — lists displaying the arrangement's dates.
 * - `["custody-detail", custodyId]` — the extended arrangement's detail.
 *
 * Other arrangements' details and unrelated caches stay untouched.
 */
export function useExtendCustody(custodyId: string) {
  const mutation = useApiMutation<CustodyArrangement, ExtendCustodyPayload>(
    (payload) => custodyService.extendCustody(custodyId, payload.endDate),
    {
      invalidates: [custodyKeys.listRoot, custodyKeys.detail(custodyId)],
    }
  );

  return {
    extendCustody: (payload: ExtendCustodyPayload) =>
      mutation.mutate(payload),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
