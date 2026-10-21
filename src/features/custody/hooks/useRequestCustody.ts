import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { custodyService } from "../../../api/custodyService";
import type { CustodyRequest } from "../schemas/custodySchemas";
import type { CustodyArrangement } from "../types/custody";
import { custodyKeys } from "./useCustodyList";

/**
 * useRequestCustody — request a new temporary custody arrangement.
 *
 * Invalidation scope (asserted in the tests):
 *
 * 1. `["custody"]` — every list variant, because the new arrangement now
 *    belongs in whichever list the user is looking at.
 * 2. `["custody-detail", createdId]` — the arrangement the user is navigated
 *    to, so its view reads from a guaranteed-fresh cache entry. The id only
 *    exists once the server responds, so this invalidation runs in
 *    `onSuccess`.
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

        // Take the user straight to the arrangement that was just created.
        navigate(`/custody/${created.id}/timeline`);
      },
    },
  );

  return {
    requestCustody: (payload: CustodyRequest) => mutation.mutate(payload),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
