import { useCallback, useEffect } from "react";
import type { UIEvent } from "react";
import { NotificationItem } from "./NotificationItem";
import { SkeletonLoader } from "../loaders/SkeletonLoader";
import type { Notification } from "../../types/notifications";
import { recordNotificationFirstRender } from "../../lib/perf";

export interface NotificationListProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string | number) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

export function NotificationList({
  notifications,
  onMarkAllRead,
  onMarkRead,
  onLoadMore,
  isLoading = false,
  isLoadingMore = false,
  hasMore = true,
}: NotificationListProps) {
  useEffect(() => {
    if (notifications.length > 0) {
      recordNotificationFirstRender();
    }
  }, [notifications.length]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasMore || isLoadingMore) {
        return;
      }

      const target = event.currentTarget;
      const nearBottom =
        target.scrollTop + target.clientHeight >= target.scrollHeight - 12;

      if (nearBottom) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoadingMore],
  );

  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Mark all read
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLoader key={index} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          You are all caught up
        </div>
      ) : (
        <div
          onScroll={handleScroll}
          className="max-h-96 overflow-y-auto divide-y divide-gray-100"
          data-testid="notification-list-scroll"
        >
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isRead={notification.isRead ?? false}
              onRead={onMarkRead}
            />
          ))}

          {isLoadingMore && (
            <div className="space-y-3 p-4">
              <SkeletonLoader />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
