import type { InfiniteData } from "@tanstack/react-query";
import type { Conversation, Message, MessagesPage } from "./types/message";

/**
 * Pure helpers over the `["messages", conversationId]` infinite-query cache.
 *
 * Page 0 is the newest page and later pages are older; each page is oldest →
 * newest. Optimistic sends, HTTP responses, realtime pushes and read receipts
 * all go through these so a message never appears twice.
 */

export type MessagesCache = InfiniteData<MessagesPage, string | undefined>;

function matches(existing: Message, incoming: Message): boolean {
  if (existing.id === incoming.id) return true;
  return Boolean(existing.clientId && incoming.clientId && existing.clientId === incoming.clientId);
}

/** Chronological, de-duplicated view of the whole thread. */
export function flattenMessages(data: MessagesCache | undefined): Message[] {
  if (!data) return [];
  const out: Message[] = [];
  for (const page of [...data.pages].reverse()) {
    for (const message of page.data) {
      const index = out.findIndex((m) => matches(m, message));
      if (index === -1) out.push(message);
      else out[index] = message;
    }
  }
  return out;
}

export function findMessage(data: MessagesCache | undefined, id: string): Message | undefined {
  return flattenMessages(data).find((m) => m.id === id || m.clientId === id);
}

/**
 * Inserts `message`, or replaces every existing copy (matched by id or
 * clientId). Collapsing all copies into the first one's slot is what stops a
 * retry, an HTTP response and a socket echo from producing duplicates.
 *
 * Returns `undefined` when the thread isn't cached: there is nothing to merge
 * into, and the next fetch will include the message.
 */
export function upsertMessage(
  data: MessagesCache | undefined,
  message: Message,
): MessagesCache | undefined {
  if (!data || data.pages.length === 0) return data;

  let placed = false;
  const pages = data.pages.map((page) => {
    const next: Message[] = [];
    for (const existing of page.data) {
      if (matches(existing, message)) {
        if (!placed) {
          next.push({ ...existing, ...message });
          placed = true;
        }
        continue;
      }
      next.push(existing);
    }
    return { ...page, data: next };
  });

  if (!placed) {
    pages[0] = { ...pages[0], data: [...pages[0].data, message] };
  }
  return { ...data, pages };
}

export function removeMessage(
  data: MessagesCache | undefined,
  idOrClientId: string,
): MessagesCache | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.filter((m) => m.id !== idOrClientId && m.clientId !== idOrClientId),
    })),
  };
}

export function markMessagesRead(
  data: MessagesCache | undefined,
  ids: readonly string[],
  readAt: string,
): MessagesCache | undefined {
  if (!data) return data;
  const set = new Set(ids);
  let changed = false;
  const pages = data.pages.map((page) => ({
    ...page,
    data: page.data.map((m) => {
      if (!set.has(m.id) || m.readAt) return m;
      changed = true;
      return { ...m, readAt };
    }),
  }));
  return changed ? { ...data, pages } : data;
}

/** Ids from `ids` that are currently unread in the cache. */
export function unreadAmong(data: MessagesCache | undefined, ids: readonly string[]): string[] {
  const set = new Set(ids);
  return flattenMessages(data)
    .filter((m) => set.has(m.id) && !m.readAt)
    .map((m) => m.id);
}

// ─── Conversation list ───────────────────────────────────────────────────────

/** Applies a new message to the conversation list (preview, ordering, unread badge). */
export function applyMessageToConversations(
  list: Conversation[] | undefined,
  message: Message,
  bumpUnread: boolean,
): Conversation[] | undefined {
  if (!list) return list;
  const next = list.map((c) =>
    c.id === message.conversationId
      ? {
          ...c,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: c.unreadCount + (bumpUnread ? 1 : 0),
        }
      : c,
  );
  return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function decrementUnread(
  list: Conversation[] | undefined,
  conversationId: string,
  by: number,
): Conversation[] | undefined {
  if (!list || by <= 0) return list;
  return list.map((c) =>
    c.id === conversationId ? { ...c, unreadCount: Math.max(0, c.unreadCount - by) } : c,
  );
}
