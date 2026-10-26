import { delay, http, HttpResponse } from "msw";
import type { Conversation, Message, MessageAttachment } from "../../features/messaging/types/message";

// Messaging contract (no backend model yet; align when it lands):
//   GET  /api/conversations
//   GET  /api/conversations/:id/messages?cursor=&limit=  → { data (oldest→newest), nextCursor }
//   POST /api/conversations/:id/messages                 JSON or multipart; idempotent on clientId
//   POST /api/conversations/:id/messages/read            { messageIds }
//   GET  /api/messages/:messageId/attachments/:attachmentId/url → { url, expiresAt }

/** Placeholder sender id resolved to the signed-in user per request. */
const ME = "__me__";
const OTHER = { id: "user-jane", name: "Jane Doe" };

const MINUTE = 60_000;

function seedConversation(id: string, count: number, unread: number): Message[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const fromOther = i % 3 !== 0;
    const age = (count - i) * 90 * MINUTE; // ~1.5h apart → spans several days
    const isUnread = fromOther && i >= count - unread;
    return {
      id: `${id}-m${String(i + 1).padStart(3, "0")}`,
      conversationId: id,
      senderId: fromOther ? OTHER.id : ME,
      senderName: fromOther ? OTHER.name : "You",
      body: fromOther ? `Message ${i + 1} from Jane about the adoption.` : `Reply ${i + 1} from me.`,
      attachments: [],
      createdAt: new Date(now - age).toISOString(),
      readAt: fromOther && !isUnread ? new Date(now - age + MINUTE).toISOString() : fromOther ? null : undefined,
    };
  });
}

let store: Record<string, Message[]>;
let titles: Record<string, string>;

/** Restores seed data. Called by tests between cases. */
export function resetMessagesMock(): void {
  store = {
    "conv-1": seedConversation("conv-1", 55, 2),
    "conv-2": seedConversation("conv-2", 6, 1),
  };
  titles = { "conv-1": "Jane Doe · Buddy's adoption", "conv-2": "Shelter Paws · Whiskers" };
}
resetMessagesMock();

function meFrom(request: Request): { id: string; name: string } {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const id = token.startsWith("mock-token-") ? token.slice("mock-token-".length) : "user-me";
  return { id, name: "You" };
}

function resolve(message: Message, me: string): Message {
  return message.senderId === ME ? { ...message, senderId: me } : message;
}

function conversationSummary(id: string, me: string): Conversation {
  const messages = store[id];
  const last = messages[messages.length - 1] ?? null;
  return {
    id,
    title: titles[id],
    lastMessage: last ? resolve(last, me) : null,
    unreadCount: messages.filter((m) => m.senderId !== ME && m.senderId !== me && !m.readAt).length,
    updatedAt: last?.createdAt ?? new Date(0).toISOString(),
  };
}

const TINY_PNG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#cbd5e1"/></svg>');

export const messageHandlers = [
  http.get("*/api/conversations", async ({ request }) => {
    await delay(Number(new URL(request.url).searchParams.get("delay") ?? 0));
    const me = meFrom(request).id;
    const list = Object.keys(store)
      .map((id) => conversationSummary(id, me))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return HttpResponse.json(list);
  }),

  http.get("*/api/conversations/:id/messages", async ({ request, params }) => {
    const id = String(params.id);
    const messages = store[id];
    if (!messages) return HttpResponse.json({ message: "Conversation not found" }, { status: 404 });

    const url = new URL(request.url);
    await delay(Number(url.searchParams.get("delay") ?? 0));
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const cursor = url.searchParams.get("cursor");
    const me = meFrom(request).id;

    // The cursor is the id of the oldest message already delivered.
    const end = cursor ? messages.findIndex((m) => m.id === cursor) : messages.length;
    const start = Math.max(0, end - limit);
    const data = messages.slice(start, end).map((m) => resolve(m, me));
    return HttpResponse.json({ data, nextCursor: start > 0 ? messages[start].id : null });
  }),

  http.post("*/api/conversations/:id/messages", async ({ request, params }) => {
    const id = String(params.id);
    const messages = store[id];
    if (!messages) return HttpResponse.json({ message: "Conversation not found" }, { status: 404 });
    const me = meFrom(request);

    let body = "";
    let clientId = "";
    const files: File[] = [];
    if ((request.headers.get("Content-Type") ?? "").includes("multipart/form-data")) {
      const form = await request.formData();
      body = String(form.get("body") ?? "");
      clientId = String(form.get("clientId") ?? "");
      form.getAll("files").forEach((f) => f instanceof File && files.push(f));
    } else {
      const json = (await request.json()) as { body?: string; clientId?: string };
      body = json.body ?? "";
      clientId = json.clientId ?? "";
    }

    if (!body.trim() && files.length === 0) {
      return HttpResponse.json({ message: "Message is empty" }, { status: 422 });
    }
    if (files.length > 3) {
      return HttpResponse.json({ message: "At most 3 attachments" }, { status: 422 });
    }

    // Idempotency: a retry with the same clientId returns the original message.
    const existing = clientId ? messages.find((m) => m.clientId === clientId) : undefined;
    if (existing) return HttpResponse.json(resolve(existing, me.id), { status: 200 });

    const messageId = `${id}-m${String(messages.length + 1).padStart(3, "0")}`;
    const attachments: MessageAttachment[] = files.map((file, i) => ({
      id: `${messageId}-a${i + 1}`,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      url: file.type.startsWith("image/") ? TINY_PNG : undefined,
    }));
    const message: Message = {
      id: messageId,
      clientId: clientId || undefined,
      conversationId: id,
      senderId: ME,
      senderName: me.name,
      body: body.trim(),
      attachments,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    messages.push(message);
    return HttpResponse.json(resolve(message, me.id), { status: 201 });
  }),

  http.post("*/api/conversations/:id/messages/read", async ({ request, params }) => {
    const messages = store[String(params.id)];
    if (!messages) return HttpResponse.json({ message: "Conversation not found" }, { status: 404 });
    const { messageIds = [] } = (await request.json()) as { messageIds?: string[] };
    const readAt = new Date().toISOString();
    messages.forEach((m) => {
      if (messageIds.includes(m.id) && !m.readAt) m.readAt = readAt;
    });
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/messages/:messageId/attachments/:attachmentId/url", ({ params }) => {
    return HttpResponse.json({
      url: `https://files.example.com/${params.messageId}/${params.attachmentId}?sig=short-lived`,
      expiresAt: new Date(Date.now() + 5 * MINUTE).toISOString(),
    });
  }),
];
