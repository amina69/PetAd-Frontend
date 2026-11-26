import { apiClient } from "../../../lib/api-client";
import type { Conversation, Message, MessagesPage } from "../types/message";

export const MESSAGES_PAGE_SIZE = 20;

export interface SendMessageInput {
  body: string;
  /** Idempotency key: retrying with the same key must not create a second message. */
  clientId: string;
  files?: File[];
}

export interface AttachmentUrl {
  url: string;
  /** ISO timestamp after which `url` stops working. */
  expiresAt: string;
}

/**
 * Messaging API.
 *
 * Endpoints (see src/mocks/handlers/messages.ts for the mocked contract):
 *   GET  /conversations
 *   GET  /conversations/:id/messages?cursor=&limit=   newest page first
 *   POST /conversations/:id/messages                  JSON, or multipart with `files`
 *   POST /conversations/:id/messages/read             { messageIds }
 *   GET  /messages/:messageId/attachments/:attachmentId/url
 */
export const messageService = {
  listConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>("/conversations");
  },

  getMessages(
    conversationId: string,
    cursor?: string,
    limit: number = MESSAGES_PAGE_SIZE,
  ): Promise<MessagesPage> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return apiClient.get<MessagesPage>(
      `/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`,
    );
  },

  sendMessage(conversationId: string, input: SendMessageInput): Promise<Message> {
    const path = `/conversations/${encodeURIComponent(conversationId)}/messages`;

    if (input.files && input.files.length > 0) {
      const form = new FormData();
      form.append("body", input.body);
      form.append("clientId", input.clientId);
      input.files.forEach((file) => form.append("files", file));
      return apiClient.post<Message>(path, form);
    }
    return apiClient.post<Message>(path, { body: input.body, clientId: input.clientId });
  },

  async markRead(conversationId: string, messageIds: string[]): Promise<void> {
    await apiClient.post(`/conversations/${encodeURIComponent(conversationId)}/messages/read`, {
      messageIds,
    });
  },

  /** Short-lived download URL for a non-image attachment. Fetch it on click, never cache it. */
  getAttachmentUrl(messageId: string, attachmentId: string): Promise<AttachmentUrl> {
    return apiClient.get<AttachmentUrl>(
      `/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}/url`,
    );
  },
};
