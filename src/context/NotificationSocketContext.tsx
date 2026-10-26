import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { ToastContext } from "../components/toast/ToastProvider";
import { UNREAD_NOTIFICATION_COUNT_QUERY_KEY } from "../features/notifications/hooks/useUnreadNotificationCount";

/**
 * Connection states for the notification WebSocket:
 * - connected: WebSocket is open and receiving messages
 * - disconnected: WebSocket is closed and not attempting to reconnect
 * - reconnecting: WebSocket is closed but attempting to reconnect (with backoff)
 */
export type NotificationConnectionState = "connected" | "disconnected" | "reconnecting";

export interface NotificationSocketContextValue {
  /** Current connection state */
  connectionState: NotificationConnectionState;
  /** Number of consecutive reconnect attempts */
  reconnectAttempts: number;
  /** Timestamp of last successful connection, or null */
  lastConnectedAt: number | null;
  /**
   * Most recent notification frame received on the socket, or null before
   * the first message. Consumers (e.g. useAdoptionStatus) use it to react
   * to entity-specific events without opening their own connection.
   */
  lastMessage: NotificationMessage | null;
  /** Manually trigger a reconnection attempt */
  reconnect: () => void;
}

const NotificationSocketContext = createContext<NotificationSocketContextValue | null>(null);

const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

/** Query prefixes refreshed when a notification arrives or after a reconnect. */
const NOTIFICATION_QUERY_KEYS = [["notifications"], UNREAD_NOTIFICATION_COUNT_QUERY_KEY] as const;

export interface NotificationMessage {
  type: string;
  payload: {
    title?: unknown;
    message?: unknown;
    /** Entity id this notification refers to (e.g. an adoption id). */
    metadata?: { resourceId?: unknown };
  };
}

function parseNotificationMessage(data: unknown): NotificationMessage | null {
  if (typeof data !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(data);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      typeof (parsed as { type?: unknown }).type === "string" &&
      typeof (parsed as { payload?: unknown }).payload === "object" &&
      (parsed as { payload?: unknown }).payload !== null
    ) {
      return parsed as NotificationMessage;
    }
  } catch {
    // Non-JSON frames (e.g. heartbeats) are ignored.
  }
  return null;
}

function getReconnectDelay(attempt: number): number {
  const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(2, attempt), RECONNECT_MAX_DELAY);
  const jitter = Math.random() * delay * 0.1;
  return delay + jitter;
}

export interface NotificationSocketProviderProps {
  children: ReactNode;
  /** Override for testing: simulate a specific initial state */
  initialState?: NotificationConnectionState;
  /** Override for testing: whether to actually attempt WebSocket connections */
  enabled?: boolean;
}

export function NotificationSocketProvider({
  children,
  initialState = "disconnected",
  enabled = true,
}: NotificationSocketProviderProps) {
  const [connectionState, setConnectionState] = useState<NotificationConnectionState>(initialState);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastConnectedAt, setLastConnectedAt] = useState<number | null>(null);
  const [lastMessage, setLastMessage] = useState<NotificationMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const hasConnectedRef = useRef(false);

  // Both are optional so the provider still works in isolated tests.
  const queryClient = useContext(QueryClientContext);
  const toast = useContext(ToastContext);
  const queryClientRef = useRef(queryClient);
  const toastRef = useRef(toast);
  useEffect(() => {
    queryClientRef.current = queryClient;
    toastRef.current = toast;
  });

  const refreshNotificationQueries = useCallback(() => {
    const client = queryClientRef.current;
    if (!client) return;
    for (const queryKey of NOTIFICATION_QUERY_KEYS) {
      client.invalidateQueries({ queryKey: [...queryKey] });
    }
  }, []);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    const token = (() => {
      try {
        return localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token");
      } catch {
        return null;
      }
    })();

    if (!token) {
      setConnectionState("disconnected");
      return;
    }

    try {
      const configuredSocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = configuredSocketUrl
        ? new URL(configuredSocketUrl)
        : new URL(`${protocol}//${window.location.host}/api/ws/notifications`);
      if (wsUrl.protocol !== "ws:" && wsUrl.protocol !== "wss:") {
        throw new Error("VITE_WEBSOCKET_URL must use ws:// or wss://");
      }
      wsUrl.searchParams.set("token", token);
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnectionState("connected");
        setReconnectAttempts(0);
        setLastConnectedAt(Date.now());

        // Backfill: anything emitted while we were offline is only reachable
        // through the REST endpoints, so refetch them after a reconnect.
        if (hasConnectedRef.current) {
          refreshNotificationQueries();
        }
        hasConnectedRef.current = true;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        const message = parseNotificationMessage(event.data);
        if (!message) return;

        setLastMessage(message);
        refreshNotificationQueries();

        const { title, message: body } = message.payload;
        toastRef.current?.showToast({
          type: "info",
          title: typeof title === "string" ? title : "New notification",
          message: typeof body === "string" ? body : "",
        });
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        wsRef.current = null;

        // Code 4001 = Unauthorized — don't reconnect
        if (event.code === 4001) {
          setConnectionState("disconnected");
          return;
        }

        // Normal close (code 1000) — don't reconnect
        if (event.code === 1000) {
          setConnectionState("disconnected");
          return;
        }

        // Abnormal close — attempt reconnection
        setConnectionState("reconnecting");
        setReconnectAttempts((prev) => {
          const next = prev + 1;
          const delay = getReconnectDelay(next);
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
          return next;
        });
      };

      ws.onerror = () => {
        // onerror is always followed by onclose, so we don't need to handle it separately
      };
    } catch {
      setConnectionState("reconnecting");
      setReconnectAttempts((prev) => {
        const next = prev + 1;
        const delay = getReconnectDelay(next);
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
        return next;
      });
    }
  }, [enabled, refreshNotificationQueries]);

  const reconnect = useCallback(() => {
    cleanup();
    setReconnectAttempts(0);
    setConnectionState("reconnecting");
    // Small delay before attempting to reconnect
    reconnectTimerRef.current = setTimeout(() => {
      connect();
    }, 100);
  }, [cleanup, connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);

  const value: NotificationSocketContextValue = {
    connectionState,
    reconnectAttempts,
    lastConnectedAt,
    lastMessage,
    reconnect,
  };

  return (
    <NotificationSocketContext.Provider value={value}>
      {children}
    </NotificationSocketContext.Provider>
  );
}

/**
 * Hook to access the notification socket connection state.
 * Must be used within a NotificationSocketProvider.
 */
export function useNotificationSocket(): NotificationSocketContextValue {
  const context = useContext(NotificationSocketContext);
  if (!context) {
    throw new Error("useNotificationSocket must be used within a NotificationSocketProvider");
  }
  return context;
}
