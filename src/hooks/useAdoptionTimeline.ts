import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import type { AdoptionTimelineEntry } from "../types/adoption";

export function useAdoptionTimeline(adoptionId: string) {
  const { data, isLoading, isError } = useApiQuery<AdoptionTimelineEntry[]>(
    ["adoption", adoptionId, "timeline"],
    () => adoptionService.getTimeline(adoptionId)
  );

  return {
    entries: data ?? [],
    isLoading,
    isError,
  };
}
