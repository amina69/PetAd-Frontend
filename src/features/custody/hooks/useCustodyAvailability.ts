import { useQuery } from "@tanstack/react-query";
import { custodyService } from "../../../api/custodyService";
import { custodyKeys } from "./useCustodyList";

/**
 * TanStack Query hook reading the days a pet cannot be placed in custody
 * for.
 *
 * The dates are reported by the API (`GET /custody/availability`) and are
 * date-only strings, so they can be handed straight to the date range
 * picker without any time-zone reinterpretation.
 *
 * @param petId - The pet the availability is requested for.
 */
export function useCustodyAvailability(petId: string | undefined) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: custodyKeys.availability(petId ?? ""),
    queryFn: () => custodyService.getAvailability(petId!),
    enabled: Boolean(petId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    unavailableDates: data?.unavailableDates ?? [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
