import { apiClient } from "../lib/api-client";

export const resolveDispute = async (
  disputeId: string,
  shelterPercent: number,
  adopterPercent: number,
  resolutionNote?: string,
  assignedAdminId?: string,
) => {
  return apiClient.post(`/disputes/${disputeId}/resolve`, {
    shelterPercent,
    adopterPercent,
    ...(resolutionNote ? { adminNote: resolutionNote } : {}),
    ...(assignedAdminId ? { assignedAdminId } : {}),
  });
};

export const updateDisputeStatus = async (
  disputeId: string,
  status: "UNDER_REVIEW",
  resolutionNote: string,
  assignedAdminId?: string,
) =>
  apiClient.patch(`/disputes/${disputeId}/status`, {
    status,
    adminNote: resolutionNote,
    ...(assignedAdminId ? { assignedAdminId } : {}),
  });
