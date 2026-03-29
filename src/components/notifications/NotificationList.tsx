import { useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { EmptyState } from '../ui/emptyState';
import { Skeleton } from '../ui/Skeleton';
import type { Notification } from '../../types/notifications';

/**
 * Props for NotificationList component.
 */
export interface NotificationListProps {
  /** Array of notification data objects */
  notifications: Notification[];
  /** Whether the list is currently fetching more notifications */
  isFetching?: boolean;
  /** Whether there are more notifications that can be loaded */
  hasNextPage?: boolean;
  /** Callback triggered to mark all notifications as read */
  onMarkAllRead: () => void;
  /** Callback triggered to mark a single notification as read */
  onMarkRead: (id: string | number) => void;
  /** Callback triggered when the end of the list is reached */
  onLoadMore?: () => void;
  /** Set of notification IDs that have been read */
  readNotificationIds?: Set<string | number>;
}

/**
 * A beautiful, scrollable list of notifications with infinite loading support.
 * Features a mark-all-read option, empty states, and skeleton loading.
 */
export function NotificationList({
  notifications,
  isFetching,
  hasNextPage,
  onMarkAllRead,
  onMarkRead,
  onLoadMore,
  readNotificationIds = new Set(),
}: NotificationListProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  // Setup Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!onLoadMore || !hasNextPage || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTrigger = triggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [hasNextPage, isFetching, onLoadMore]);

  // Initial loading state
  if (isFetching && notifications.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            Notifications
          </h2>
          <Skeleton variant="text" width="80px" height="20px" className="rounded-md" />
        </div>
        <div className="flex flex-col flex-1 divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex gap-4">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="30%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Header Component
  const Header = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
        <Bell className="w-4 h-4 text-orange-500" />
        Notifications
      </h2>
      <button
        onClick={onMarkAllRead}
        className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-all duration-200 flex items-center gap-1 hover:bg-orange-50 px-2 py-1 rounded-md"
        aria-label="Mark all notifications as read"
      >
        <CheckCheck className="w-3.5 h-3.5" />
        Mark all read
      </button>
    </div>
  );

  // Empty State
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px]">
        {Header}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/50">
          <EmptyState
            title="You are all caught up!"
            description="You don't have any new notifications right now. Enjoy your peaceful day!"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-[600px]">
      {Header}

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="flex flex-col divide-y divide-gray-100">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              isRead={readNotificationIds.has(n.id)}
              onRead={onMarkRead}
            />
          ))}

          {/* Trigger element for infinite scroll */}
          <div ref={triggerRef} className="h-4" aria-hidden="true" />

          {/* Loading more indicators */}
          {hasNextPage && (
            <div className="flex flex-col divide-y divide-gray-100">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="px-4 py-4 flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="90%" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
