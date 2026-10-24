import { useApiMutation } from "./useApiMutation";
import { useQueryClient } from "@tanstack/react-query";
import { UNREAD_NOTIFICATION_COUNT_QUERY_KEY } from "../features/notifications/hooks/useUnreadNotificationCount";
import type { NotificationsPage } from "../types/notifications";

type NotificationCache = {
  pages: NotificationsPage[];
  pageParams: (string | undefined)[];
};

type NotificationCacheEntry =
  | NotificationCache
  | NotificationsPage;

function markAllAsRead(
  cache: NotificationCacheEntry | undefined,
): NotificationCacheEntry | undefined {
  if (!cache) return cache;

  if ("pages" in cache && Array.isArray(cache.pages)) {
    return {
      ...cache,
      pages: cache.pages.map((page) => ({
        ...page,
        data: page.data.map((n) => ({ ...n, isRead: true })),
      })),
    };
  }

  if ("data" in cache && Array.isArray(cache.data)) {
    return {
      ...cache,
      data: cache.data.map((n) => ({ ...n, isRead: true })),
    };
  }

  return cache;
}

async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch("/api/notifications/read-all", { method: "POST" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to mark all notifications read: ${res.status}`);
  }
}

export function useMutateMarkAllRead() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useApiMutation<void, void>(
    () => markAllNotificationsRead(),
    {
      invalidates: [["notifications"], [...UNREAD_NOTIFICATION_COUNT_QUERY_KEY]],
      onOptimisticUpdate: () => {
        const snapshot = queryClient.getQueriesData<NotificationCacheEntry>({
          queryKey: ["notifications"],
        });

        queryClient.setQueriesData<NotificationCacheEntry>(
          { queryKey: ["notifications"] },
          (old) => markAllAsRead(old),
        );

        // Zero the unread badge immediately so the UI reflects "all read"
        // before the server confirms.
        queryClient.setQueryData<number>(
          UNREAD_NOTIFICATION_COUNT_QUERY_KEY,
          0,
        );

        return snapshot;
      },

      onRollback: (snapshot) => {
        (snapshot as [string, NotificationCacheEntry | undefined][]).forEach(
          ([queryKey, data]) => {
            queryClient.setQueryData(queryKey as [string], data);
          },
        );

        // Restore the unread count that was visible before the optimistic flip.
        const countSnapshot = (snapshot as [string, unknown][]).find(
          ([key]) =>
            Array.isArray(key) &&
            key[0] === "notification-unread-count",
        );
        if (countSnapshot?.[1] != null) {
          queryClient.setQueryData(
            UNREAD_NOTIFICATION_COUNT_QUERY_KEY,
            countSnapshot[1] as number,
          );
        }
      },
    },
  );

  return {
    markAllRead: () => mutate(),
    isPending,
    isError,
    error,
  };
}
