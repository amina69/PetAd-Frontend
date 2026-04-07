import { useQuery } from "@tanstack/react-query";
import { custodyService } from "../api/custodyService";
import { useApiQuery } from "./useApiQuery";

interface UseCustodyListParams {
  status?: string[];
}

export function useCustodyList(params?: UseCustodyListParams) {
  return useApiQuery(
    ['custody-list', params?.status],
    () => custodyService.getList(params),
    {
      enabled: true,
    }
  );
}
