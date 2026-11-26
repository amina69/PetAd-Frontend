import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import { queryKeys } from "../lib/queryKeys";
import type { AdoptionTimelineEntry } from "../types/adoption";
import { STALE_TIME } from "../lib/staleTime";

export function useAdoptionTimeline(adoptionId: string) {
  const { data, isLoading, isError } = useApiQuery<AdoptionTimelineEntry[]>(
    queryKeys.adoptions.timeline(adoptionId),
    () => adoptionService.getTimeline(adoptionId),
    // Timeline events are append-only, so a short cache avoids refetching on every navigation.
    { staleTime: STALE_TIME.TIMELINES },
  );

  return {
    entries: data ?? [],
    isLoading,
    isError,
  };
}
