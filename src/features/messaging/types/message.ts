/** Client-only delivery state of a message. Server messages are always `sent`. */
export type MessageStatus = "sending" | "sent" | "failed";

export interface MessageAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Inline-renderable URL (images only). Files are fetched on demand via a short-lived URL. */
  url?: string;
}

export interface Message {
  id: string;
  /**
   * Client-generated idempotency key. Set on messages this client sent; lets
   * the optimistic copy, the HTTP response and the realtime echo collapse into
   * one message.
   */
  clientId?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  attachments: MessageAttachment[];
  createdAt: string;
  /** ISO timestamp the recipient read it; null/undefined when unread. */
  readAt?: string | null;
  status?: MessageStatus;
}

/** One page of a thread, oldest → newest. `nextCursor` points at older messages. */
export interface MessagesPage {
  data: Message[];
  nextCursor?: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  role?: string;
}

/** Realtime envelopes pushed on the messages socket. */
export const MESSAGE_CREATED = "MESSAGE_CREATED";
export const MESSAGES_READ = "MESSAGES_READ";

export interface MessagesReadPayload {
  conversationId: string;
  messageIds: string[];
  readAt: string;
}
