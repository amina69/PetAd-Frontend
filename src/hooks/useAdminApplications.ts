import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adoptionService, type AdminApprovalFilters } from "../api/adoptionService";
import type { AdminApprovalQueueResponse } from "../features/approval/schemas/approvalSchemas";

interface DecisionVariables {
  applicationId: string;
  decision: "approve" | "reject";
}

export function useAdminApplications(filters: AdminApprovalFilters) {
  const queryClient = useQueryClient();
  const queryKey = ["adminApplications", filters] as const;
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      adoptionService.getAdminApprovalQueue({
        ...filters,
        cursor: typeof pageParam === "string" ? pageParam : undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const decisionMutation = useMutation({
    mutationFn: ({ applicationId, decision }: DecisionVariables) =>
      adoptionService.decideAdminApproval(applicationId, decision),
    onMutate: async ({ applicationId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData<{
        pages: AdminApprovalQueueResponse[];
        pageParams: unknown[];
      }>(queryKey, (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== applicationId),
          })),
        },
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    applications: query.data?.pages.flatMap((page) => page.items) ?? [],
    decide: decisionMutation.mutateAsync,
    isDeciding: decisionMutation.isPending,
  };
}
