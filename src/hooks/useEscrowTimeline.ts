import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import type { AdoptionTimelineEntry } from "../types/adoption";

export function useEscrowTimeline(adoptionId: string) {
  const { data, isLoading, isError } = useApiQuery<AdoptionTimelineEntry[]>(
    ["adoption", adoptionId, "timeline"],
    () => adoptionService.getTimeline(adoptionId)
  );

  const entries = data?.filter((entry) => entry.sdkEvent.startsWith("ESCROW_")) ?? [];

  return {
    entries,
    isLoading,
    isError,
  };
}
