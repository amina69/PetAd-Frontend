import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api-client";
import { usePolling } from "./usePolling";

interface NotificationCountResponse {
  count: number;
}

export function useNotificationCount() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const query = usePolling<NotificationCountResponse>(
    ["notification-count"],
    () => apiClient.get<NotificationCountResponse>("/notifications?status=UNREAD&limit=0"),
    {
      intervalMs: 60000,
      pauseOnHidden: true,
    },
  );

  useEffect(() => {
    if (location.pathname !== "/notifications") {
      return;
    }

    const markAllRead = async () => {
      try {
        await apiClient.post("/notifications/read-all");
        queryClient.setQueryData<NotificationCountResponse>(["notification-count"], {
          count: 0,
        });
      } catch (error) {
        console.warn("Failed to mark notifications read", error);
      }
    };

    markAllRead();
  }, [location.pathname, queryClient]);

  return {
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
  };
}
