import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationCount } from "../../lib/hooks/useNotificationCount";
import { useNotificationSocket } from "../../context/NotificationSocketContext";
import type { NotificationConnectionState } from "../../context/NotificationSocketContext";

const CONNECTION_INDICATOR_COLORS: Record<NotificationConnectionState, string> = {
  connected: "bg-green-500",
  reconnecting: "bg-amber-500",
  disconnected: "bg-red-500",
};

export interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const { count } = useNotificationCount();
  const { connectionState } = useNotificationSocket();
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
  const indicatorColor = CONNECTION_INDICATOR_COLORS[connectionState];
  const ariaLabel = connectionState === "connected"
    ? `Notifications, ${count} unread`
    : `Notifications, ${count} unread, connection ${connectionState}`;

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

      {/* Connection state indicator dot */}
      <span
        data-testid="connection-indicator"
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${indicatorColor} ${connectionState === "reconnecting" ? "animate-pulse" : ""}`}
        aria-label={`Notification connection: ${connectionState}`}
      />

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
