import { useQuery } from "@tanstack/react-query";
import type { NotificationsPage } from "../../../types/notifications";
import { STALE_TIME } from "../../../lib/staleTime";

/**
 * Kept outside the `["notifications"]` prefix: the mark-read hooks rewrite
 * every query under that prefix assuming a paginated shape.
 */
export const UNREAD_NOTIFICATION_COUNT_QUERY_KEY = ["notification-unread-count"] as const;

async function fetchUnreadCount(): Promise<number> {
  const params = new URLSearchParams({ filter: "unread", limit: "1" });
  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) throw new Error(`Failed to fetch unread count: ${response.status}`);
  const page = (await response.json()) as NotificationsPage;
  return page.total;
}

/**
 * Unread notification count for the navbar badge. The notification socket
 * provider invalidates this key whenever a push arrives or the socket
 * reconnects, so the badge updates without a page reload.
 */
export function useUnreadNotificationCount(): number {
  const { data } = useQuery({
    queryKey: UNREAD_NOTIFICATION_COUNT_QUERY_KEY,
    queryFn: fetchUnreadCount,
    // Unread badge is live: always stale so focus/mount refetches keep it accurate.
    staleTime: STALE_TIME.NOTIFICATIONS,
  });
  return data ?? 0;
}
