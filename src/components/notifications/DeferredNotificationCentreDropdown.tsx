import { lazy, Suspense, useState } from "react";
import { Bell } from "lucide-react";

const NotificationCentreDropdown = lazy(() =>
  import("./NotificationCentreDropdown").then((module) => ({
    default: module.NotificationCentreDropdown,
  })),
);

/**
 * Keeps the notification panel out of the initial bundle until the user opens it.
 * The lightweight trigger remains available while the panel chunk is loading.
 */
export function DeferredNotificationCentreDropdown() {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
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
    );
  }

  return (
    <button
      type="button"
      aria-label="Open notifications"
      aria-expanded={false}
      aria-haspopup="dialog"
      onClick={() => setActivated(true)}
      className="relative p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      <Bell size={20} aria-hidden="true" />
    </button>
  );
}
