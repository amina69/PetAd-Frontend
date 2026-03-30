import { Link2, AlertTriangle, CheckCircle, Clock, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationRouter } from '../../lib/notificationRouter';
import type { Notification, NotificationType } from '../../types/notifications';


export interface NotificationItemProps {
  notification: Notification;
  isRead: boolean;
  onRead: (id: string | number) => void;
}


interface TimeDisplay {
  relative: string;
  absolute: string | null;
}

function getTimeDisplay(timeStr: string): TimeDisplay {
  const date = new Date(timeStr);

  if (!isNaN(date.getTime())) {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    let relative: string;
    if (diffMins < 1) {
      relative = 'just now';
    } else if (diffMins < 60) {
      relative = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      relative = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      relative = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }

    return { relative, absolute: date.toLocaleString() };
  }

  return { relative: timeStr, absolute: null };
}


interface IconConfig {
  icon: React.ReactNode;
  wrapperBg: string;
}

function getIconConfig(type: NotificationType): IconConfig {
  const t = type.toUpperCase();

  if (t.includes('ESCROW') || t.includes('SETTLEMENT')) {
    return {
      icon: <Link2 className="w-4 h-4 text-teal-600" aria-hidden="true" />,
      wrapperBg: 'bg-teal-100',
    };
  }
  if (t.includes('DISPUTE')) {
    return {
      icon: <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />,
      wrapperBg: 'bg-red-100',
    };
  }
  if (t.includes('APPROVAL')) {
    return {
      icon: <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />,
      wrapperBg: 'bg-green-100',
    };
  }
  if (t.includes('DOCUMENT') || t.includes('CUSTODY')) {
    return {
      icon: <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />,
      wrapperBg: 'bg-amber-100',
    };
  }

  return {
    icon: <Bell className="w-4 h-4 text-gray-500" aria-hidden="true" />,
    wrapperBg: 'bg-gray-100',
  };
}

export function NotificationItem({
  notification,
  isRead,
  onRead,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const { relative, absolute } = getTimeDisplay(notification.time);
  const { icon, wrapperBg } = getIconConfig(notification.type);

  function handleActivate() {
    onRead(notification.id);
    navigate(notificationRouter(notification));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${isRead ? 'Read' : 'Unread'} notification: ${notification.title}`}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      }}
      className={[
        'flex items-start gap-3 px-4 py-3 w-full',
        'cursor-pointer transition-colors duration-150',
        'border-b border-gray-100 last:border-b-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset',
        isRead
          ? 'bg-white hover:bg-gray-50'
          : 'bg-orange-50 hover:bg-orange-100',
      ].join(' ')}
    >

      <span
        aria-hidden="true"
        data-testid="unread-dot"
        className={[
          'shrink-0 mt-2 w-2 h-2 rounded-full',
          isRead ? 'invisible' : 'bg-orange-500',
        ].join(' ')}
      />

      <div
        data-testid="icon-wrapper"
        className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${wrapperBg}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p
          data-testid="notification-title"
          className={[
            'text-sm text-gray-900 truncate',
            isRead ? 'font-medium' : 'font-bold',
          ].join(' ')}
        >
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <time
          dateTime={notification.time}
          title={absolute ?? undefined}
          className="block mt-1 text-xs text-gray-400 hover:text-gray-600 cursor-help"
        >
          {relative}
        </time>
      </div>

      {notification.hasArrow && (
        <svg
          aria-hidden="true"
          className="shrink-0 mt-1 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}