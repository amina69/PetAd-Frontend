import { useApiMutation } from "../../../hooks/useApiMutation";
import { custodyService } from "../../../api/custodyService";
import type { CustodyArrangement } from "../types/custody";
import { custodyKeys } from "./useCustodyList";

/** Payload accepted by `useExtendCustody`. */
export interface ExtendCustodyPayload {
  /** New end date for the arrangement, as a date-only (`YYYY-MM-DD`) string. */
  endDate: string;
}

/**
 * useExtendCustody — extend the end date of a custody arrangement.
 *
 * Invalidates exactly two keys on success (asserted in the tests):
 *
 * - `["custody"]` — the lists displaying the arrangement's dates.
 * - `["custody-detail", custodyId]` — the extended arrangement's detail.
 *
 * Other arrangements' details, escrow caches and unrelated domains stay
 * untouched.
 */
export function useExtendCustody(custodyId: string) {
  const mutation = useApiMutation<CustodyArrangement, ExtendCustodyPayload>(
    (payload) => custodyService.extendCustody(custodyId, payload.endDate),
    {
      invalidates: [custodyKeys.listRoot, custodyKeys.detail(custodyId)],
    },
  );

  return {
    extendCustody: (payload: ExtendCustodyPayload) => mutation.mutate(payload),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
