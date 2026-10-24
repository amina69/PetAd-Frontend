import { useCallback, useEffect, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification, NotificationFilter, NotificationsPage } from "../types/notifications";

const PAGE_SIZE = 10;

/**
 * Events arriving within this window are coalesced into a single state
 * update (plus one coalesced set of PATCH requests), so a burst of
 * notifications re-renders consumers at most once per window instead of
 * once per event. (Issue #548, G6)
 */
export const BATCH_WINDOW_MS = 250;

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

type NotificationsCache = {
  pages: NotificationsPage[];
  pageParams: (string | undefined)[];
};

/**
 * Applies optimistic "isRead" updates for the given ids across every
 * "notifications" query in the cache in a single setQueriesData call, so a
 * whole batch window produces ONE cache write (and one re-render) instead of
 * one per event.
 */
function applyOptimisticRead(
  queryClient: ReturnType<typeof useQueryClient>,
  ids: string[],
): void {
  const idSet = new Set(ids);
  queryClient.setQueriesData<NotificationsCache>(
    { queryKey: ["notifications"] },
    (old) => {
      // Guard against caches with a different shape (e.g. the dropdown's
      // plain NotificationsPage) that also match the "notifications" prefix.
      if (!old || !Array.isArray(old.pages)) return old;
      let changed = false;
      const pages = old.pages.map((page) => ({
        ...page,
        data: page.data.map((n) => {
          if (!idSet.has(String(n.id)) || n.isRead) return n;
          changed = true;
          return { ...n, isRead: true };
        }),
      }));
      // Avoid a state update (and re-render) when nothing actually changed.
      return changed ? { ...old, pages } : old;
    },
  );
}

function sendReadPatch(id: string): void {
  fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
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

  // ------------------------------------------------------------------
  // High-frequency event batching (issue #548, G6)
  // ------------------------------------------------------------------
  // Without batching, each incoming notification event (mark-as-read,
  // optimistic cache update, etc.) triggers its own cache write and therefore
  // its own render. Rapid-fire events (e.g. a burst of 20 in under a second)
  // would re-render once per event. Events are queued in a ref and flushed
  // as ONE cache update at most once per BATCH_WINDOW_MS.
  const pendingEventIdsRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBatchedEvents = useCallback(() => {
    flushTimerRef.current = null;
    const ids = Array.from(pendingEventIdsRef.current);
    pendingEventIdsRef.current = new Set();
    if (ids.length === 0) return;
    // ONE optimistic cache write for the whole window → at most one
    // re-render for every event queued during it.
    applyOptimisticRead(queryClient, ids);
    // Coalesced network persistence for everything queued in this window.
    for (const id of ids) sendReadPatch(id);
  }, [queryClient]);

  const queueNotificationEvent = useCallback(
    (id: string | number) => {
      pendingEventIdsRef.current.add(String(id));
      if (flushTimerRef.current === null) {
        flushTimerRef.current = setTimeout(flushBatchedEvents, BATCH_WINDOW_MS);
      }
    },
    [flushBatchedEvents],
  );

  // On unmount, clear the pending timer but still persist any queued reads
  // so the batched PATCHes are never lost. No state update is needed here.
  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      const pending = Array.from(pendingEventIdsRef.current);
      pendingEventIdsRef.current = new Set();
      for (const id of pending) sendReadPatch(id);
    };
  }, []);

  /**
   * Marks a notification as read. Rapid calls are coalesced: the optimistic
   * cache update and the network PATCHes fire at most once per
   * BATCH_WINDOW_MS, in a single batched state update.
   */
  const markRead = useCallback(
    (id: string | number) => {
      queueNotificationEvent(id);
    },
    [queueNotificationEvent],
  );

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
