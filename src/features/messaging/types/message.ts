export interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
  }>;
  petId: string;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export type MessageStatus = "sending" | "sent" | "failed";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachments: Array<{
    id: string;
    fileName: string;
    url: string;
    contentType?: string;
  }>;
  sentAt: string;
  status: MessageStatus;
}

export interface MessagePage {
  items: Message[];
  nextCursor?: string | null;
}
