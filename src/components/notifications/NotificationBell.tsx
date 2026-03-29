import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationCount } from "../../lib/hooks/useNotificationCount";

export interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const { count } = useNotificationCount();
  const prevCountRef = useRef<number | null>(null);
  const [bellAnimKey, setBellAnimKey] = useState(0);

  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = count;
      return;
    }
    if (count > prevCountRef.current) {
      setBellAnimKey((k) => k + 1);
    }
    prevCountRef.current = count;
  }, [count]);

  const badgeText = count > 9 ? "9+" : String(count);
  const ariaLabel = `Notifications, ${count} unread`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-2.5 bg-gray-50 rounded-full text-gray-700 hover:bg-gray-100 transition-colors ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      <span
        key={bellAnimKey}
        data-testid="notification-bell-icon-wrap"
        className={`inline-flex ${bellAnimKey > 0 ? "animate-notification-bell" : ""}`}
        aria-hidden="true"
      >
        <Bell size={20} strokeWidth={2} />
      </span>
      {count > 0 ? (
        <span
          data-testid="notification-bell-badge"
          className="absolute -top-1 -right-1 flex min-w-5 h-5 px-1 items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white"
          aria-hidden="true"
        >
          {badgeText}
        </span>
      ) : null}
    </button>
  );
}
