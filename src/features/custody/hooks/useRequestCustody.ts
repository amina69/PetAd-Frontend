import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { custodyService } from "../../../api/custodyService";
import type { CustodyArrangement } from "../types";
import type { CustodyRequest } from "../schemas/custodySchemas";
import { custodyKeys } from "./useCustodyList";

/** useRequestCustody — create a custody arrangement and jump to it.

 * Invalidation scope (asserted in tests):
 * 1. `["custody"]` — every list variant, because the new arrangement now
 *    belongs in any list the user may be viewing.
 * 2. `["custody-detail", createdId]` — the arrangement being navigated to, so
 *    its view reads from a guaranteed-fresh cache entry. The id only exists
 *    once the server responds, so this invalidation runs in `onSuccess`.
 *
 * Nothing else is invalidated: other arrangements' detail caches, escrow
 * caches and unrelated domains are left untouched.
 */
export function useRequestCustody() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useApiMutation<CustodyArrangement, CustodyRequest>(
    (payload) => custodyService.requestCustody(payload),
    {
      invalidates: [custodyKeys.listRoot],
      onSuccess: (created) => {
        queryClient.invalidateQueries({
          queryKey: custodyKeys.detail(created.id),
        });
        navigate(`/custody/${created.id}/timeline`);
      },
    }
  );

  return {
    requestCustody: (payload: CustodyRequest) =>
      mutation.mutate(payload),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
