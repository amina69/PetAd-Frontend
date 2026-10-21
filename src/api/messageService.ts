import { apiClient } from "../lib/api-client";
import {
  conversationListSchema,
  messagePageSchema,
} from "../features/messaging/schemas/messageSchemas";
import type { Conversation, MessagePage } from "../features/messaging/types/message";

export const messageService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<unknown>("/messages/conversations");
    return conversationListSchema.parse(response);
  },

  async getConversationMessages(
    conversationId: string,
    cursor?: string,
  ): Promise<MessagePage> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);

    const query = params.toString();
    const response = await apiClient.get<unknown>(
      `/messages/conversations/${encodeURIComponent(conversationId)}/messages${query ? `?${query}` : ""}`,
    );
    return messagePageSchema.parse(response);
  },
};
