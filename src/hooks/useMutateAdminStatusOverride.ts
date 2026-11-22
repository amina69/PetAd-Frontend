import { adoptionService, type StatusOverride } from "../api/adoptionService";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "./useApiMutation";
import { queryKeys } from "../lib/queryKeys";



export function useMutateAdminStatusOverride(adoptionId: string) {
   const queryClient = useQueryClient();

   const editStatus = async (statusData: StatusOverride) => {
   await adoptionService.editStatus(adoptionId, statusData);
};

    const { isPending, error, mutateAsync } = useApiMutation(
        editStatus,
        {
            invalidates: [queryKeys.adoptions.detail(adoptionId)],
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: queryKeys.adoptions.detail(adoptionId) });
            },
        },
    );

    return {
        isPending,
        error,
        mutateAsync
    };
}
