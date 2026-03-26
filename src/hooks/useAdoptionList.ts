import { adoptionService } from "../api/adoptionService";
import { useApiQuery } from "./useApiQuery";
import type { AdoptionRequest, AdoptionStatus } from "../types/adoption";

interface UseAdoptionListParams {
  status?: AdoptionStatus[];
}

export function useAdoptionList(params: UseAdoptionListParams = {}) {
  const normalizedStatuses = [...(params.status ?? [])].sort();

  return useApiQuery<AdoptionRequest[]>(
    ["adoption-requests", normalizedStatuses],
    () => adoptionService.getList({ status: normalizedStatuses }),
  );
}
