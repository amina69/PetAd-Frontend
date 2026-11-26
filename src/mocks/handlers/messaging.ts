import { http, HttpResponse } from "msw";

const conversations = [
  {
    id: "conversation-101",
    participants: [
      { id: "user-current", name: "You" },
      { id: "user-shelter-1", name: "Happy Paws Shelter" },
    ],
    petId: "pet-1",
    lastMessage: {
      id: "message-103",
      conversationId: "conversation-101",
      senderId: "user-shelter-1",
      body: "I'll send the updated care information shortly.",
      attachments: [],
      sentAt: new Date().toISOString(),
      status: "sent",
    },
    unreadCount: 2,
    updatedAt: new Date().toISOString(),
  },
];

const messages = [
  {
    id: "message-101",
    conversationId: "conversation-101",
    senderId: "user-current",
    body: "Could you share Buddy's latest vaccination records?",
    attachments: [],
    sentAt: "2026-10-20T09:00:00.000Z",
    status: "sent",
  },
  {
    id: "message-102",
    conversationId: "conversation-101",
    senderId: "user-shelter-1",
    body: "Yes, I can send those through today.",
    attachments: [
      {
        id: "attachment-1",
        fileName: "vaccination-record.pdf",
        url: "https://example.com/vaccination-record.pdf",
        contentType: "application/pdf",
      },
    ],
    sentAt: "2026-10-20T10:30:00.000Z",
    status: "sent",
  },
  {
    id: "message-103",
    conversationId: "conversation-101",
    senderId: "user-shelter-1",
    body: "I'll send the updated care information shortly.",
    attachments: [],
    sentAt: new Date().toISOString(),
    status: "sent",
  },
];

export const messagingHandlers = [
  http.get("/api/messages/conversations", () =>
    HttpResponse.json({ items: conversations }),
  ),
  http.get("/api/messages/conversations/:id/messages", ({ params, request }) => {
    const conversationId = String(params.id);
    if (!conversations.some((conversation) => conversation.id === conversationId)) {
      return HttpResponse.json({ message: "Conversation not found" }, { status: 404 });
    }

    const cursor = new URL(request.url).searchParams.get("cursor");
    const pageItems = cursor
      ? messages.slice(0, 1)
      : messages.slice(1);
    return HttpResponse.json({
      items: pageItems,
      nextCursor: cursor ? null : "older",
    });
  }),
];
