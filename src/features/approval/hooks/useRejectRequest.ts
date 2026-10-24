import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalService } from "../api/approvalService";
import { approvalKeys } from "./useApprovalList";
import type { ApprovalResponse } from "../schemas/approvalSchemas";

/**
 * Mutation hook to reject an approval request with a reason.
 *
 * The rejection reason is validated locally (min 20 chars) by
 * `approvalService.rejectRequest` before any network call. On success,
 * invalidates the `["approvals"]` query key so the approval list refetches.
 * A 409 Conflict (request already decided) propagates as a mutation error.
 */
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation<ApprovalResponse, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) =>
      approvalService.rejectRequest(id, { reason }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}
