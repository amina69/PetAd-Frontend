import { useQuery } from "@tanstack/react-query";
import { custodyService } from "../../api/custodyService";

export function useCustodyDetails(custodyId: string | undefined) {
  const enabled = Boolean(custodyId);

  const query = useQuery({
    queryKey: ["custody-details", custodyId],
    queryFn: () => custodyService.getDetails(custodyId!),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
