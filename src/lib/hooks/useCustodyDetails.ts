import { useQuery } from "@tanstack/react-query";
import { custodyService } from "../../api/custodyService";

export function useCustodyDetails(custodyId: string | undefined) {
  const enabled = Boolean(custodyId);

  const query = useQuery({
    queryKey: ["custody-details", custodyId],
    queryFn: () => custodyService.getDetails(custodyId!),
    enabled,
    // Custody history is immutable after recording, so the shared cache is sufficient.
    staleTime: 30_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
