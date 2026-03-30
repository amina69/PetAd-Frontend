import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api-client";
import type { DisputeListResponse } from "../types/dispute";


interface UseDisputesParams {
  status?: string;
  overdue?: boolean;
}

export function useDisputes({ status, overdue }: UseDisputesParams = {}) {
  const queryParams = { status, overdue };

  const query = useInfiniteQuery({
    queryKey: ["disputes", queryParams],
    queryFn: async ({ pageParam }: { pageParam: string | undefined | unknown }) => {
      const params = new URLSearchParams();
      
      if (status && status !== "all") {
        params.append("status", status);
      }
      if (overdue) {
        params.append("overdue", "true");
      }
      if (typeof pageParam === "string") {
        params.append("cursor", pageParam);
      }

      // Call the relative route which apiClient will prefix with baseURL
      return apiClient.get<DisputeListResponse>(`/disputes?${params.toString()}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: DisputeListResponse) => lastPage.nextCursor,
  });

  // Extract all loaded items into a single flattened array
  const allDisputes = query.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    ...query,
    disputes: allDisputes,
    isLoadingMore: query.isFetchingNextPage,
  };
}
