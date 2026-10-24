import { describe, expect, it } from "vitest";
import {
  applyMessageToConversations,
  decrementUnread,
  flattenMessages,
  markMessagesRead,
  removeMessage,
  unreadAmong,
  upsertMessage,
  type MessagesCache,
} from "../messageCache";
import type { Conversation } from "../types/message";
import { msg } from "./testUtils";

function cache(...pages: ReturnType<typeof msg>[][]): MessagesCache {
  return { pages: pages.map((data) => ({ data })), pageParams: pages.map(() => undefined) };
}

describe("messageCache", () => {
  it("flattens pages chronologically (older pages first)", () => {
    const [a, b, c, d] = [msg(), msg(), msg(), msg()];
    // page 0 = newest page, page 1 = older
    expect(flattenMessages(cache([c, d], [a, b])).map((m) => m.id)).toEqual([a.id, b.id, c.id, d.id]);
  });

  it("de-duplicates by id when flattening overlapping pages", () => {
    const [a, b] = [msg(), msg()];
    expect(flattenMessages(cache([b], [a, b]))).toHaveLength(2);
  });

  it("appends a new message to the newest page", () => {
    const a = msg();
    const b = msg();
    const next = upsertMessage(cache([a]), b)!;
    expect(next.pages[0].data.map((m) => m.id)).toEqual([a.id, b.id]);
  });

  it("dedupes an incoming message that already exists (same id)", () => {
    const a = msg();
    const next = upsertMessage(cache([a]), { ...a })!;
    expect(flattenMessages(next)).toHaveLength(1);
  });

  it("replaces an optimistic temp message by clientId", () => {
    const temp = msg({ id: "tmp-1", clientId: "c-1", status: "sending" });
    const server = msg({ id: "real-1", clientId: "c-1" });
    const next = upsertMessage(cache([temp]), server)!;
    const all = flattenMessages(next);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("real-1");
  });

  it("collapses temp + echo into one when the echo arrived first", () => {
    const temp = msg({ id: "tmp-1", clientId: "c-1", status: "sending" });
    const echo = msg({ id: "real-1" }); // socket echo without clientId
    const withEcho = upsertMessage(cache([temp]), echo)!;
    expect(flattenMessages(withEcho)).toHaveLength(2);
    // HTTP response arrives carrying both the real id and the clientId
    const merged = upsertMessage(withEcho, { ...echo, clientId: "c-1", status: "sent" })!;
    expect(flattenMessages(merged).map((m) => m.id)).toEqual(["real-1"]);
  });

  it("returns undefined/unchanged when the thread isn't cached", () => {
    expect(upsertMessage(undefined, msg())).toBeUndefined();
  });

  it("removes by id or clientId", () => {
    const a = msg({ clientId: "c-9" });
    expect(flattenMessages(removeMessage(cache([a]), "c-9"))).toEqual([]);
  });

  it("marks messages read once and reports which were unread", () => {
    const [a, b] = [msg(), msg({ readAt: "2026-01-01T00:00:00Z" })];
    const data = cache([a, b]);
    expect(unreadAmong(data, [a.id, b.id])).toEqual([a.id]);
    const next = markMessagesRead(data, [a.id, b.id], "2026-02-02T00:00:00Z")!;
    const [ra, rb] = flattenMessages(next);
    expect(ra.readAt).toBe("2026-02-02T00:00:00Z");
    expect(rb.readAt).toBe("2026-01-01T00:00:00Z"); // untouched
  });

  describe("conversation list", () => {
    const list: Conversation[] = [
      { id: "c1", title: "One", unreadCount: 1, updatedAt: "2026-01-01T00:00:00Z" },
      { id: "c2", title: "Two", unreadCount: 0, updatedAt: "2026-01-02T00:00:00Z" },
    ];

    it("bumps unread, sets preview and re-sorts", () => {
      const m = msg({ conversationId: "c1", createdAt: "2026-01-05T00:00:00Z" });
      const next = applyMessageToConversations(list, m, true)!;
      expect(next[0].id).toBe("c1");
      expect(next[0].unreadCount).toBe(2);
      expect(next[0].lastMessage?.id).toBe(m.id);
    });

    it("does not bump when told not to", () => {
      const next = applyMessageToConversations(list, msg({ conversationId: "c1" }), false)!;
      expect(next.find((c) => c.id === "c1")!.unreadCount).toBe(1);
    });

    it("decrements without going below zero", () => {
      expect(decrementUnread(list, "c1", 5)!.find((c) => c.id === "c1")!.unreadCount).toBe(0);
    });
  });
});
