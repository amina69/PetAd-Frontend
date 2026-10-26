import { apiClient } from "../lib/api-client";
import { useApiQuery } from "./useApiQuery";
import type { NotificationPreferences } from "../types/notifications";
import { STALE_TIME } from "../lib/staleTime";

// close #C11: per-category notification preference toggles support
export const useNotificationPreferences = () => {
  return useApiQuery<NotificationPreferences>(
    ["notificationPreferences"],
    () => apiClient.get<NotificationPreferences>("/notifications/preferences"),
    // Preferences only change through this user's own mutation, which invalidates the key.
    { staleTime: STALE_TIME.APPROVALS },
  );
};
