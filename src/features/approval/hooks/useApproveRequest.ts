import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalService } from "../api/approvalService";
import { approvalKeys } from "./useApprovalList";
import type { ApprovalResponse } from "../schemas/approvalSchemas";

/**
 * Mutation hook to approve an approval request.
 *
 * On success, invalidates the `["approvals"]` query key so the approval list
 * refetches and reflects the new decision. A 409 Conflict (request already
 * decided by another operator) propagates as a standard mutation error.
 */
export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation<ApprovalResponse, Error, string>({
    mutationFn: (id: string) => approvalService.approveRequest(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
  });
}
