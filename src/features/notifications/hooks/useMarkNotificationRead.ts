import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { notificationService } from "../../../api/notificationService";
import type { NotificationsPage } from "../../../types/notifications";

/**
 * Cache shapes that hold notifications:
 * - Paginated infinite-query caches, e.g. ["notifications", "all"]
 * - Single-page caches, e.g. ["notifications", "dropdown"]
 */
type NotificationCacheEntry =
  | { pages: NotificationsPage[]; pageParams: (string | undefined)[] }
  | NotificationsPage;

function setReadFlag(
  cache: NotificationCacheEntry | undefined,
  id: string | number,
  isRead: boolean,
): NotificationCacheEntry | undefined {
  if (!cache) return cache;

  if ("pages" in cache && Array.isArray(cache.pages)) {
    return {
      ...cache,
      pages: cache.pages.map((page) => ({
        ...page,
        data: page.data.map((n) =>
          String(n.id) === String(id) ? { ...n, isRead } : n,
        ),
      })),
    };
  }

  if ("data" in cache && Array.isArray(cache.data)) {
    return {
      ...cache,
      data: cache.data.map((n) =>
        String(n.id) === String(id) ? { ...n, isRead } : n,
      ),
    };
  }

  return cache;
}

/**
 * useMarkNotificationRead
 *
 * Marks a notification as read with an optimistic update:
 *  1. Sets `isRead: true` in every notifications cache immediately.
 *  2. Fires `notificationService.markAsRead(id)`.
 *  3. On failure, reverts the local flag and surfaces a subtle inline
 *     error via `error`/`isError` (callers render it inline, not as a
 *     blocking toast).
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useApiMutation<
    void,
    string | number
  >((id) => notificationService.markAsRead(id), {
    invalidates: [["notifications"]],

    onOptimisticUpdate: (id) => {
      // Snapshot every notifications cache so we can restore it on failure.
      const snapshot = queryClient.getQueriesData<NotificationCacheEntry>({
        queryKey: ["notifications"],
      });

      queryClient.setQueriesData<NotificationCacheEntry>(
        { queryKey: ["notifications"] },
        (old) => setReadFlag(old, id, true),
      );

      return snapshot;
    },

    onRollback: (snapshot) => {
      (snapshot as [QueryKey, NotificationCacheEntry | undefined][]).forEach(
        ([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        },
      );
    },
  });

  return {
    markAsRead: (id: string | number) => mutate(id),
    isPending,
    isError,
    error,
  };
}
