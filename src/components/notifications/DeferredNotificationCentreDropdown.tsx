import { lazy, Suspense, useState } from "react";
import { Bell } from "lucide-react";
import { useUnreadNotificationCount } from "../../features/notifications/hooks/useUnreadNotificationCount";

const NotificationCentreDropdown = lazy(() =>
  import("./NotificationCentreDropdown").then((module) => ({
    default: module.NotificationCentreDropdown,
  })),
);

/**
 * Keeps the notification panel out of the initial bundle until the user opens it.
 * The lightweight trigger remains available while the panel chunk is loading.
 *
 * The unread badge is rendered here (not inside the panel) so live pushes
 * update it even before the panel has ever been opened.
 */
export function DeferredNotificationCentreDropdown() {
  const [activated, setActivated] = useState(false);
  const unreadCount = useUnreadNotificationCount();

  return (
    <div className="relative">
      {activated ? (
        <Suspense
          fallback={
            <span
              role="status"
              aria-label="Loading notifications"
              className="inline-flex p-2.5 text-gray-400"
            >
              <Bell size={20} aria-hidden="true" />
            </span>
          }
        >
          <NotificationCentreDropdown initialOpen />
        </Suspense>
      ) : (
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Open notifications, ${unreadCount} unread`
              : "Open notifications"
          }
          aria-expanded={false}
          aria-haspopup="dialog"
          onClick={() => setActivated(true)}
          className="relative p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <Bell size={20} aria-hidden="true" />
        </button>
      )}
      {unreadCount > 0 && (
        <span
          data-testid="notification-unread-count"
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  );
}
