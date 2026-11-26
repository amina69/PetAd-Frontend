import { petService } from "../api/petService";
import { queryClient } from "./query-client";
import { STALE_TIME } from "./staleTime";

export const petKeys = {
  detail: (id: string) => ["pets", id] as const,
};

/**
 * Warms the pet-detail cache. Called on card hover/focus so the detail page
 * opens from cache. Errors are swallowed: prefetch is best-effort.
 */
export function prefetchPetDetail(id: string): Promise<void> {
  return queryClient.prefetchQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => petService.getPet(id),
    // Pet details change rarely, so a prefetched entry stays usable for five minutes.
    staleTime: STALE_TIME.PETS,
  });
}
