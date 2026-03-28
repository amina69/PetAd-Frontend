import { useMutation } from "@tanstack/react-query";
import { resolveDispute } from "../api/disputes";

export const useResolveDispute = () => {
  return useMutation({
    mutationFn: ({
      disputeId,
      shelterPercent,
      adopterPercent,
    }: {
      disputeId: string;
      shelterPercent: number;
      adopterPercent: number;
    }) =>
      resolveDispute(disputeId, shelterPercent, adopterPercent),
  });
};