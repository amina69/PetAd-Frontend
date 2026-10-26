import { useCallback, useEffect, useRef, useState } from "react";
import {
  createNotificationSocket,
  type NotificationEnvelope,
  type NotificationSocketManager,
  type NotificationSocketOptions,
  type NotificationSocketState,
} from "../../../lib/realtime/notificationSocket";

export interface UseNotificationSocketResult {
  /** Current connection state, mirroring the C4 manager. */
  connectionState: NotificationSocketState;
  /** Consecutive failed reconnect attempts. */
  reconnectAttempts: number;
  /** True once the C4 manager has exhausted its retry budget (C12 UI). */
  hasGivenUp: boolean;
  /** Most recent message envelope received on the socket. */
  lastMessage: NotificationEnvelope | null;
  /** Force an immediate reconnection, resetting the retry budget. */
  reconnect: () => void;
}

export interface UseNotificationSocketOptions
  extends Omit<NotificationSocketOptions, "url"> {
  /** Socket URL. Pass `null` to keep the socket disconnected. */
  url: string | null;
}

/**
 * Binds the framework-agnostic C4 connection manager
 * (`src/lib/realtime/notificationSocket`) to React state.
 *
 * The manager owns all reconnection logic; this hook only mirrors its state so
 * components such as the notification bell dropdown (C12) can render
 * "connected", "reconnecting", "disconnected" and "given up" affordances.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/469
 * @see https://github.com/amina69/PetAd-Frontend/issues/478
 */
export function useNotificationSocket({
  url,
  ...options
}: UseNotificationSocketOptions): UseNotificationSocketResult {
  const [connectionState, setConnectionState] =
    useState<NotificationSocketState>("idle");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastMessage, setLastMessage] = useState<NotificationEnvelope | null>(
    null,
  );
  const managerRef = useRef<NotificationSocketManager | null>(null);
  const optionsRef = useRef(options);

  // Keep the latest options available to the (url-scoped) connect effect
  // without reconnecting on every render.
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!url) {
      return;
    }

    const manager = createNotificationSocket({ url, ...optionsRef.current });
    managerRef.current = manager;

    const unsubscribeState = manager.on("statechange", () => {
      setConnectionState(manager.state);
      setReconnectAttempts(manager.reconnectAttempts);
    });

    const unsubscribeMessage = manager.on("message", (payload) => {
      if (payload.envelope) {
        setLastMessage(payload.envelope);
      }
    });

    manager.connect();

    return () => {
      unsubscribeState();
      unsubscribeMessage();
      manager.disconnect();
      managerRef.current = null;
    };
  }, [url]);

  const reconnect = useCallback(() => {
    managerRef.current?.reconnect();
  }, []);

  return {
    connectionState,
    reconnectAttempts,
    hasGivenUp: connectionState === "given-up",
    lastMessage,
    reconnect,
  };
}
