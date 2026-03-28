import { adoptionService, type StatusOverride } from "../api/adoptionService";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "./useApiMutation";



export function useMutateAdminStatusOverride(adoptionId: string) {
   const queryClient = useQueryClient();

   const editStatus = async (statusData: StatusOverride) => {
   await adoptionService.editStatus(adoptionId, statusData);
};

    const { isPending, error, mutateAsync } = useApiMutation(
        editStatus,
        {
            invalidates: [["adoption", adoptionId]],
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["adoption", adoptionId] });
            },
        },
    );

    return {
        isPending,
        error,
        mutateAsync
    };
}
