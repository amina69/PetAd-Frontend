import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  buildNotificationSocketUrl,
  createNotificationSocket,
  type NotificationSocketOptions,
} from "../../../lib/realtime/notificationSocket";
import { useMessagingUser } from "./useMessagingUser";
import { isTabActive } from "./useMarkMessagesRead";
import { messageKeys } from "./useMessages";
import {
  applyMessageToConversations,
  decrementUnread,
  markMessagesRead,
  unreadAmong,
  upsertMessage,
  type MessagesCache,
} from "../messageCache";
import {
  MESSAGE_CREATED,
  MESSAGES_READ,
  type Conversation,
  type Message,
  type MessagesReadPayload,
} from "../types/message";

/** Socket URL for messages, or `null` when signed out. */
export function buildMessageSocketUrl(): string | null {
  let token: string | null = null;
  try {
    token = localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token");
  } catch {
    token = null;
  }
  if (!token) return null;

  const base =
    (import.meta.env.VITE_MESSAGES_WEBSOCKET_URL as string | undefined) ||
    `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws/messages`;
  return buildNotificationSocketUrl(base, token);
}

export interface UseMessageSocketSyncOptions {
  /** Thread currently on screen (its incoming messages are read, not counted unread). */
  activeConversationId?: string;
  /** Override the socket URL; `null` keeps the socket disconnected. Defaults to `buildMessageSocketUrl()`. */
  url?: string | null;
  /** Passed to the socket manager (tests inject a mock WebSocket here). */
  socketOptions?: Omit<NotificationSocketOptions, "url">;
}

function isMessage(value: unknown): value is Message {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Message).id === "string" &&
    typeof (value as Message).conversationId === "string" &&
    typeof (value as Message).senderId === "string"
  );
}

/**
 * Keeps the message caches live from the socket, without refetching:
 *
 * - `MESSAGE_CREATED` is merged into the thread cache (de-duplicated by id /
 *   clientId) and into the conversation list. An incoming message in a thread
 *   the user isn't looking at bumps that conversation's unread count in place.
 * - `MESSAGES_READ` updates read state.
 * - A reconnect triggers exactly one backfill (invalidate) for anything missed
 *   while offline.
 */
export function useMessageSocketSync({
  activeConversationId,
  url,
  socketOptions,
}: UseMessageSocketSyncOptions = {}): void {
  const queryClient = useQueryClient();
  const user = useMessagingUser();

  const activeRef = useRef(activeConversationId);
  const userIdRef = useRef(user?.id);
  const optionsRef = useRef(socketOptions);
  useEffect(() => {
    activeRef.current = activeConversationId;
    userIdRef.current = user?.id;
    optionsRef.current = socketOptions;
  });

  const resolvedUrl = url === undefined ? buildMessageSocketUrl() : url;

  useEffect(() => {
    if (!resolvedUrl) return;

    const socket = createNotificationSocket({ url: resolvedUrl, ...optionsRef.current });
    const counted = new Set<string>(); // message ids already counted as unread
    let hasConnected = false;

    const offCreated = socket.on(MESSAGE_CREATED, ({ envelope }) => {
      const message = envelope?.payload;
      if (!isMessage(message)) return;

      const threadKey = messageKeys.thread(message.conversationId);
      queryClient.setQueryData<MessagesCache>(threadKey, (data) => upsertMessage(data, message));

      const mine = message.senderId === userIdRef.current;
      const watching = activeRef.current === message.conversationId && isTabActive();
      const alreadyCounted = counted.has(message.id);
      const bump = !mine && !watching && !alreadyCounted && !message.readAt;
      if (bump) counted.add(message.id);

      queryClient.setQueryData<Conversation[]>(messageKeys.conversations, (list) =>
        applyMessageToConversations(list, message, bump),
      );
    });

    const offRead = socket.on(MESSAGES_READ, ({ envelope }) => {
      const payload = envelope?.payload as Partial<MessagesReadPayload> | undefined;
      if (!payload?.conversationId || !Array.isArray(payload.messageIds)) return;

      const key = messageKeys.thread(payload.conversationId);
      const cached = queryClient.getQueryData<MessagesCache>(key);
      const newlyRead = unreadAmong(cached, payload.messageIds).length;
      const readAt = payload.readAt ?? new Date().toISOString();
      queryClient.setQueryData<MessagesCache>(key, (data) => markMessagesRead(data, payload.messageIds!, readAt));
      // Reads by another of my sessions lower my own unread badge.
      queryClient.setQueryData<Conversation[]>(messageKeys.conversations, (list) =>
        decrementUnread(list, payload.conversationId!, newlyRead),
      );
    });

    const offOpen = socket.on("open", () => {
      if (hasConnected) {
        // Reconnected: fetch whatever was missed while offline, once.
        void queryClient.invalidateQueries({ queryKey: messageKeys.all });
        void queryClient.invalidateQueries({ queryKey: messageKeys.conversations });
      }
      hasConnected = true;
    });

    socket.connect();
    return () => {
      offCreated();
      offRead();
      offOpen();
      socket.destroy();
    };
  }, [queryClient, resolvedUrl]);
}
