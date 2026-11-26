import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../lib/api-client";
import type { NotificationPreferences } from "../types/notifications";
import { queryKeys } from "../lib/queryKeys";

export const useMutateUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      return getApiClient().patch("/notifications/preferences", preferences);
    },
    onMutate: async (newPreferences) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.preferences() });

      // Snapshot the previous value
      const previousPreferences = queryClient.getQueryData<NotificationPreferences>([
        "notificationPreferences",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.notifications.preferences(), newPreferences);

      // Return a context object with the snapshotted value
      return { previousPreferences };
    },
    onError: (_err, _newPreferences, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          queryKeys.notifications.preferences(),
          context.previousPreferences
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences() });
    },
  });
};
