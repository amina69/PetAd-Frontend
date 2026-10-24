import { apiClient } from "../lib/api-client";
import { useApiQuery } from "./useApiQuery";
import type { NotificationPreferences } from "../types/notifications";

// close #C11: per-category notification preference toggles support
export const useNotificationPreferences = () => {
  return useApiQuery<NotificationPreferences>(
    ["notificationPreferences"],
    () => apiClient.get<NotificationPreferences>("/notifications/preferences"),
  );
};
