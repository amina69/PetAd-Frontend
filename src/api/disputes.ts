import { apiClient } from "../lib/api-client";

export const resolveDispute = async (
  disputeId: string,
  shelterPercent: number,
  adopterPercent: number
) => {
  return apiClient.post(`/disputes/${disputeId}/resolve`, {
    shelterPercent,
    adopterPercent,
  });
};
