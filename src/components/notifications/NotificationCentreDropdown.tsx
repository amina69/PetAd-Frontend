import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NotificationItem } from "./index";
import { useMutateMarkRead } from "../../hooks/useMutateMarkRead";
import { useMutateMarkAllRead } from "../../hooks/useMutateMarkAllRead";
import { notificationRouter } from "../../lib/notificationRouter";
import type { Notification, NotificationsPage } from "../../types/notifications";


const DROPDOWN_LIMIT = 20;

async function fetchDropdownNotifications(): Promise<NotificationsPage> {
  const params = new URLSearchParams({ filter: "all", limit: String(DROPDOWN_LIMIT) });
  const res = await fetch(`/api/notifications?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
  return res.json() as Promise<NotificationsPage>;
}


function DropdownSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading notifications">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse border-b border-gray-50">
          <div className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-gray-200" />
          <div className="shrink-0 w-7 h-7 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 bg-gray-200 rounded w-2/5" />
            <div className="h-2.5 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}


export interface NotificationCentreDropdownProps {
  hasUnread?: boolean;
}


export function NotificationCentreDropdown({
  hasUnread = false,
}: NotificationCentreDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const navigate = useNavigate();
  const dialogId = useId();

  const { markRead, isPending: isMarkingRead } = useMutateMarkRead();
  const { markAllRead, isPending: isMarkingAll } = useMutateMarkAllRead();


  const { data, isLoading, isError } = useQuery<NotificationsPage>({
    queryKey: ["notifications", "dropdown"],
    queryFn: fetchDropdownNotifications,
    enabled: isOpen,
    staleTime: 30_000,
  });

  const notifications: Notification[] = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const showUnreadDot = hasUnread || unreadCount > 0;


  const open = useCallback(() => {
    setIsOpen(true);
    setFocusedIndex(-1);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);


  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, close]);


  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);


  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (notifications.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, notifications.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const notif = notifications[focusedIndex];
        if (notif) {
          markRead(notif.id);
          close();
          navigate(notificationRouter(notif));
        }
      }
    },
    [notifications, focusedIndex, markRead, close, navigate],
  );

  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-notification-item]");
    items[focusedIndex]?.focus();
  }, [focusedIndex]);


  const handleItemRead = useCallback(
    (id: string | number) => {
      markRead(id);
    },
    [markRead],
  );


  const handleMarkAllRead = useCallback(() => {
    markAllRead();
  }, [markAllRead]);


  return (
    <div ref={containerRef} className="relative" data-testid="notification-centre">
      {/* Bell trigger */}
      <button
        ref={triggerRef}
        type="button"
        data-testid="bell-button"
        aria-label="Open notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        onClick={toggle}
        className="relative p-2.5 bg-gray-50 rounded-full text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <Bell size={20} aria-hidden="true" />
        {showUnreadDot && (
          <span
            data-testid="unread-dot"
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Unread notifications"}
            className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
          />
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          id={dialogId}
          role="dialog"
          aria-label="Notifications"
          aria-modal="true"
          data-testid="notification-dropdown"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-[60] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span
                  data-testid="unread-badge"
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold"
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                data-testid="mark-all-read-button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div
            ref={listRef}
            onKeyDown={handleListKeyDown}
            className="max-h-80 overflow-y-auto scrollbar-minimal"
          >
            {isLoading ? (
              <DropdownSkeleton />
            ) : isError ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-gray-900">Failed to load</p>
                <p className="text-xs text-gray-500 mt-1">Please try again later.</p>
              </div>
            ) : notifications.length === 0 ? (
              <div
                data-testid="empty-state"
                className="px-4 py-8 text-center"
              >
                <p className="text-sm font-medium text-gray-900">You're all caught up!</p>
                <p className="text-xs text-gray-500 mt-1">No new notifications.</p>
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div
                  key={notif.id}
                  data-notification-item
                  data-testid={`dropdown-item-${notif.id}`}
                  tabIndex={focusedIndex === index ? 0 : -1}
                  className={[
                    "outline-none",
                    focusedIndex === index ? "ring-2 ring-inset ring-orange-300" : "",
                  ].join(" ")}
                >
                  <NotificationItem
                    notification={notif}
                    isRead={notif.isRead ?? false}
                    onRead={(id) => {
                      handleItemRead(id);
                      close();
                      navigate(notificationRouter(notif));
                    }}
                  />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {!isLoading && !isError && (
            <div className="border-t border-gray-100">
              <Link
                to="/notifications"
                data-testid="view-all-link"
                onClick={close}
                className="flex items-center justify-center w-full py-3 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-colors"
              >
                View all notifications
                {isMarkingRead && (
                  <span className="ml-2 w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                )}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}