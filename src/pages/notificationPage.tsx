import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "../components/notifications";
import { EmptyState } from "../components/ui/emptyState";
import type { Notification, NotificationFilter } from "../types/notifications";


export type DateGroupLabel = "Today" | "Yesterday" | "Earlier";

export interface NotificationGroup {
  label: DateGroupLabel;
  items: Notification[];
}

export function groupByDate(notifications: Notification[]): NotificationGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const groups: Record<DateGroupLabel, Notification[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const notif of notifications) {
    const date = new Date(notif.time);
    if (isNaN(date.getTime())) {
      groups.Today.push(notif);
    } else if (date >= todayStart) {
      groups.Today.push(notif);
    } else if (date >= yesterdayStart) {
      groups.Yesterday.push(notif);
    } else {
      groups.Earlier.push(notif);
    }
  }

  return (["Today", "Yesterday", "Earlier"] as DateGroupLabel[])
    .map((label) => ({ label, items: groups[label] }))
    .filter((g) => g.items.length > 0);
}


const TABS: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

function emptyStateProps(filter: NotificationFilter) {
  if (filter === "unread") {
    return {
      title: "No unread notifications",
      description: "You're all caught up! New notifications will appear here.",
    };
  }
  if (filter === "read") {
    return {
      title: "No read notifications",
      description: "Notifications you've opened will appear here.",
    };
  }
  return {
    title: "No notifications yet",
    description: "When activity happens on your adoptions, you'll see updates here.",
  };
}


function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="shrink-0 mt-2 w-2 h-2 rounded-full bg-gray-200" />
      <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="h-3 bg-gray-200 rounded w-2/5" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="h-2 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}


export default function NotificationsListPage() {
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const {
    notifications,
    total,
    isLoading,
    isFetchingNextPage,
    isError,
    hasNextPage,
    fetchNextPage,
    markRead,
  } = useNotifications(filter);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const grouped = useMemo(() => groupByDate(notifications), [notifications]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Notifications
          </h1>
          {filter === "all" && unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread`}
              className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold"
            >
              {unreadCount}
            </span>
          )}
        </div>
        {total > 0 && (
          <span className="text-sm text-gray-400">
            {total} notification{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Notification filters"
        className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={filter === tab.value}
            onClick={() => setFilter(tab.value)}
            className={[
              "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
              filter === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      {isError ? (
        <EmptyState
          title="Something went wrong"
          description="Failed to load notifications. Please try again."
        />
      ) : isLoading ? (
        <div
          data-testid="notifications-loading"
          className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState {...emptyStateProps(filter)} />
      ) : (
        <div
          role="list"
          aria-label="Notifications"
          className="rounded-xl border border-gray-100 overflow-hidden"
        >
          {grouped.map((group) => (
            <div key={group.label}>
              <div
                data-testid={`group-header-${group.label.toLowerCase()}`}
                className="px-4 py-2 bg-gray-50 border-b border-gray-100"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {group.items.map((notif) => (
                  <div key={notif.id} role="listitem">
                    <NotificationItem
                      notification={notif}
                      isRead={notif.isRead ?? false}
                      onRead={markRead}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div
            ref={sentinelRef}
            data-testid="scroll-sentinel"
            aria-hidden="true"
          />

          {isFetchingNextPage && (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 2 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          )}

          {!hasNextPage && notifications.length > 0 && (
            <p className="text-center text-xs text-gray-400 py-4">
              You've reached the end
            </p>
          )}
        </div>
      )}
    </div>
  );
}