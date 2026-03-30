import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification, NotificationFilter, NotificationsPage } from "../types/notifications";

const PAGE_SIZE = 10;

async function fetchNotificationsPage(
  cursor: string | undefined,
  filter: NotificationFilter,
): Promise<NotificationsPage> {
  const params = new URLSearchParams({ filter, limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) throw new Error(`Failed to fetch notifications: ${response.status}`);
  return response.json() as Promise<NotificationsPage>;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  total: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  isError: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  markRead: (id: string | number) => void;
}

export function useNotifications(filter: NotificationFilter): UseNotificationsReturn {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["notifications", filter],
    queryFn: ({ pageParam }) =>
      fetchNotificationsPage(pageParam as string | undefined, filter),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const notifications: Notification[] =
    query.data?.pages.flatMap((page) => page.data) ?? [];

  const total = query.data?.pages[0]?.total ?? 0;

  function markRead(id: string | number): void {
    queryClient.setQueriesData<{
      pages: NotificationsPage[];
      pageParams: (string | undefined)[];
    }>({ queryKey: ["notifications"] }, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map((n) =>
            String(n.id) === String(id) ? { ...n, isRead: true } : n,
          ),
        })),
      };
    });
    fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  }

  return {
    notifications,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    markRead,
  };
}