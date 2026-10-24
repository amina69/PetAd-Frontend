import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockWebSocket } from "../../../test/mockWebSocket";
import { messageKeys } from "../hooks/useMessages";
import { useMessageSocketSync } from "../hooks/useMessageSocketSync";
import { flattenMessages, type MessagesCache } from "../messageCache";
import type { Conversation } from "../types/message";
import { createWrapper, ME, msg, signIn } from "./testUtils";

const URL = "ws://test/api/ws/messages?token=t";

function setup(activeConversationId?: string) {
  const { queryClient, wrapper } = createWrapper();
  for (const id of ["c1", "c2"]) {
    queryClient.setQueryData<MessagesCache>(messageKeys.thread(id), {
      pages: [{ data: [msg({ conversationId: id })] }],
      pageParams: [undefined],
    });
  }
  queryClient.setQueryData<Conversation[]>(messageKeys.conversations, [
    { id: "c1", title: "One", unreadCount: 0, updatedAt: "2026-01-01T00:00:00.000Z" },
    { id: "c2", title: "Two", unreadCount: 0, updatedAt: "2026-01-01T00:00:00.000Z" },
  ]);

  // Reconnect timers are driven by hand so the test controls "time".
  const timers: Array<() => void> = [];
  const hook = renderHook(
    () =>
      useMessageSocketSync({
        activeConversationId,
        url: URL,
        socketOptions: {
          WebSocketImpl: MockWebSocket,
          reconnectOnFocus: false,
          setTimeoutFn: (handler) => {
            timers.push(handler);
            return 0 as unknown as ReturnType<typeof setTimeout>;
          },
        },
      }),
    { wrapper },
  );

  const socket = MockWebSocket.latest();
  act(() => socket.open());

  const push = (type: string, payload: unknown) => act(() => socket.receive({ type, payload }));
  const thread = (id: string) => flattenMessages(queryClient.getQueryData<MessagesCache>(messageKeys.thread(id)));
  const unread = (id: string) =>
    queryClient.getQueryData<Conversation[]>(messageKeys.conversations)!.find((c) => c.id === id)!.unreadCount;

  return { ...hook, queryClient, socket, timers, push, thread, unread };
}

describe("useMessageSocketSync", () => {
  beforeEach(() => {
    signIn();
    MockWebSocket.reset();
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it("bumps the unread count of a thread that isn't open, without any refetch", async () => {
    const { push, unread, thread, queryClient } = setup("c1");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    push("MESSAGE_CREATED", msg({ conversationId: "c2", body: "psst" }));
    push("MESSAGE_CREATED", msg({ conversationId: "c2", body: "again" }));

    expect(unread("c2")).toBe(2);
    expect(unread("c1")).toBe(0);
    expect(thread("c2").map((m) => m.body)).toContain("psst");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("updates the conversation preview and moves it to the top", () => {
    const { push, queryClient } = setup("c1");
    const incoming = msg({ conversationId: "c2", body: "latest", createdAt: "2026-06-01T00:00:00.000Z" });
    push("MESSAGE_CREATED", incoming);

    const list = queryClient.getQueryData<Conversation[]>(messageKeys.conversations)!;
    expect(list[0].id).toBe("c2");
    expect(list[0].lastMessage?.body).toBe("latest");
  });

  it("doesn't count a message as unread when its thread is open and the tab is active", () => {
    const { push, unread, thread } = setup("c1");
    push("MESSAGE_CREATED", msg({ conversationId: "c1", body: "live" }));
    expect(thread("c1").map((m) => m.body)).toContain("live");
    expect(unread("c1")).toBe(0);
  });

  it("does count it when the thread is open but the tab is hidden/unfocused", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
    const { push, unread } = setup("c1");
    push("MESSAGE_CREATED", msg({ conversationId: "c1" }));
    expect(unread("c1")).toBe(1);
  });

  it("ignores the user's own messages for unread", () => {
    const { push, unread } = setup("c1");
    push("MESSAGE_CREATED", msg({ conversationId: "c2", senderId: ME.id }));
    expect(unread("c2")).toBe(0);
  });

  it("dedupes redelivered events by id (no duplicate bubble, no double count)", () => {
    const { push, unread, thread } = setup("c1");
    const m = msg({ conversationId: "c2", body: "once" });
    push("MESSAGE_CREATED", m);
    push("MESSAGE_CREATED", { ...m });

    expect(thread("c2").filter((x) => x.body === "once")).toHaveLength(1);
    expect(unread("c2")).toBe(1);
  });

  it("merges the echo of an optimistic send by clientId", () => {
    const { push, thread, queryClient } = setup("c1");
    queryClient.setQueryData<MessagesCache>(messageKeys.thread("c1"), {
      pages: [{ data: [msg({ id: "tmp-x", clientId: "x", status: "sending", senderId: ME.id, conversationId: "c1" })] }],
      pageParams: [undefined],
    });

    push("MESSAGE_CREATED", msg({ id: "srv-1", clientId: "x", senderId: ME.id, conversationId: "c1" }));
    expect(thread("c1").map((m) => m.id)).toEqual(["srv-1"]);
  });

  it("ignores malformed events", () => {
    const { push, unread } = setup("c1");
    push("MESSAGE_CREATED", { nope: true });
    push("MESSAGE_CREATED", null);
    expect(unread("c1")).toBe(0);
  });

  it("applies MESSAGES_READ to the cache and lowers the unread badge", () => {
    const { push, queryClient, unread, thread } = setup("c1");
    const m = msg({ conversationId: "c2", id: "to-read" });
    push("MESSAGE_CREATED", m);
    expect(unread("c2")).toBe(1);

    push("MESSAGES_READ", { conversationId: "c2", messageIds: ["to-read"], readAt: "2026-02-02T00:00:00.000Z" });
    expect(thread("c2").find((x) => x.id === "to-read")?.readAt).toBe("2026-02-02T00:00:00.000Z");
    expect(unread("c2")).toBe(0);
    expect(queryClient.isFetching()).toBe(0);
  });

  describe("reconnect", () => {
    it("does not backfill on the first connection", () => {
      const { queryClient } = setup("c1");
      const invalidate = vi.spyOn(queryClient, "invalidateQueries");
      expect(invalidate).not.toHaveBeenCalled();
    });

    it("triggers exactly one backfill refetch after a reconnect", async () => {
      const { queryClient, socket, timers } = setup("c1");
      const invalidate = vi.spyOn(queryClient, "invalidateQueries");

      act(() => socket.close(1006)); // network drop
      await waitFor(() => expect(timers.length).toBeGreaterThan(0));
      act(() => timers.at(-1)!()); // backoff elapsed → new socket
      const second = MockWebSocket.latest();
      expect(second).not.toBe(socket);
      act(() => second.open());

      const keys = invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey));
      expect(keys).toEqual([JSON.stringify(messageKeys.all), JSON.stringify(messageKeys.conversations)]);
    });
  });

  it("tears the socket down on unmount", () => {
    const { unmount, socket } = setup("c1");
    unmount();
    expect(socket.readyState).toBe(3);
  });

  it("stays disconnected with a null url", () => {
    MockWebSocket.reset();
    const { wrapper } = createWrapper();
    renderHook(() => useMessageSocketSync({ url: null, socketOptions: { WebSocketImpl: MockWebSocket } }), { wrapper });
    expect(MockWebSocket.instances).toHaveLength(0);
  });
});
