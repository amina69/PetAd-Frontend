import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "../lib/api-client";
import type { NotificationPreferences } from "../types/notifications";

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async (): Promise<NotificationPreferences> => {
      return getApiClient().get("/notifications/preferences");
    },
  });
};