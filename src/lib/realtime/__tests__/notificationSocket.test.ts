import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildNotificationSocketUrl,
  createNotificationSocket,
  type NotificationSocketManager,
  type NotificationSocketOptions,
  type NotificationSocketState,
} from "../notificationSocket";
import { MockWebSocket } from "../../../test/mockWebSocket";

const SOCKET_URL = "ws://localhost/api/ws/notifications";

let managers: NotificationSocketManager[] = [];

type ManagerOverrides = Partial<Omit<NotificationSocketOptions, "url">> & {
  url?: string;
};

function createManager(
  overrides: ManagerOverrides = {},
): NotificationSocketManager {
  const { url = SOCKET_URL, ...rest } = overrides;
  const manager = createNotificationSocket({
    url,
    WebSocketImpl: MockWebSocket,
    ...rest,
  });
  managers.push(manager);
  return manager;
}

function latest(): MockWebSocket {
  return MockWebSocket.latest();
}

describe("notificationSocket (C4)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.reset();
    managers = [];
    // jsdom reports "visible", but pin it so the focus test is deterministic.
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(() => {
    managers.forEach((manager) => manager.disconnect());
    vi.useRealTimers();
  });

  // ── Happy-path connect ────────────────────────────────────────────────────

  it("connects and reports the connecting → connected transition", () => {
    const manager = createManager();
    const states: NotificationSocketState[] = [];
    manager.on("statechange", ({ state }) => states.push(state));

    manager.connect();

    expect(manager.state).toBe("connecting");
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(latest().url).toBe(SOCKET_URL);

    latest().open();

    expect(manager.state).toBe("connected");
    expect(manager.reconnectAttempts).toBe(0);
    expect(states).toEqual(["connecting", "connected"]);
  });

  it("does not create a duplicate connection when connect() is called again", () => {
    const manager = createManager();

    manager.connect();
    manager.connect();
    expect(MockWebSocket.instances).toHaveLength(1);

    latest().open();
    manager.connect();
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  // ── Message receipt ───────────────────────────────────────────────────────

  it("dispatches typed envelopes to on(type) and on('message')", () => {
    const manager = createManager();
    const typedHandler = vi.fn();
    const messageHandler = vi.fn();
    manager.on("ESCROW_FUNDED", typedHandler);
    manager.on("message", messageHandler);

    manager.connect();
    latest().open();

    const envelope = {
      eventId: "evt_1",
      type: "ESCROW_FUNDED",
      timestamp: "2026-03-30T12:00:00.000Z",
      payload: { id: "notif-101" },
    };
    latest().receive(envelope);

    expect(messageHandler).toHaveBeenCalledTimes(1);
    expect(typedHandler).toHaveBeenCalledTimes(1);
    expect(typedHandler.mock.calls[0][0].envelope).toEqual(envelope);
    expect(typedHandler.mock.calls[0][0].state).toBe("connected");
  });

  it("stops notifying a handler after it unsubscribes", () => {
    const manager = createManager();
    const handler = vi.fn();
    const unsubscribe = manager.on("DISPUTE_RAISED", handler);

    manager.connect();
    latest().open();
    latest().receive({ type: "DISPUTE_RAISED", payload: {} });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    latest().receive({ type: "DISPUTE_RAISED", payload: {} });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("forwards non-envelope payloads on the generic 'message' event", () => {
    const manager = createManager();
    const messageHandler = vi.fn();
    manager.on("message", messageHandler);

    manager.connect();
    latest().open();
    latest().receive("plain-text-frame");

    expect(messageHandler).toHaveBeenCalledTimes(1);
    expect(messageHandler.mock.calls[0][0].envelope).toBeUndefined();
    expect(messageHandler.mock.calls[0][0].raw).toBe("plain-text-frame");
  });

  // ── Forced disconnect + reconnect (exponential backoff) ───────────────────

  it("reconnects with exponential backoff (1s, 2s, 4s) after abnormal closes", () => {
    const manager = createManager();
    manager.connect();
    latest().open();

    // 1st failure → retry after 1s
    latest().close(1006);
    expect(manager.state).toBe("reconnecting");
    expect(manager.reconnectAttempts).toBe(1);
    vi.advanceTimersByTime(999);
    expect(MockWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(2);

    // 2nd failure → retry after 2s
    latest().close(1006);
    expect(manager.reconnectAttempts).toBe(2);
    vi.advanceTimersByTime(1999);
    expect(MockWebSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(3);

    // 3rd failure → retry after 4s
    latest().close(1006);
    expect(manager.reconnectAttempts).toBe(3);
    vi.advanceTimersByTime(3999);
    expect(MockWebSocket.instances).toHaveLength(3);
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(4);
  });

  it("resets the retry budget after a successful reconnection", () => {
    const manager = createManager();
    manager.connect();
    latest().open();

    latest().close(1006);
    vi.advanceTimersByTime(1000);
    expect(manager.reconnectAttempts).toBe(1);
    expect(manager.state).toBe("reconnecting");

    latest().open();
    expect(manager.state).toBe("connected");
    expect(manager.reconnectAttempts).toBe(0);
  });

  it("computes a capped exponential backoff schedule", () => {
    const manager = createManager({ maxRetries: 12 });

    expect(manager.computeBackoffDelay(1)).toBe(1000);
    expect(manager.computeBackoffDelay(2)).toBe(2000);
    expect(manager.computeBackoffDelay(3)).toBe(4000);
    expect(manager.computeBackoffDelay(12)).toBe(30000);
  });

  // ── Max-retry give-up ─────────────────────────────────────────────────────

  it("enters the given-up state and stops retrying after maxRetries", () => {
    const manager = createManager({ maxRetries: 2 });
    const giveUpHandler = vi.fn();
    manager.on("giveup", giveUpHandler);

    manager.connect();
    latest().open();

    latest().close(1006);
    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances).toHaveLength(2);

    latest().close(1006);
    vi.advanceTimersByTime(2000);
    expect(MockWebSocket.instances).toHaveLength(3);

    latest().close(1006);

    expect(manager.state).toBe("given-up");
    expect(manager.isGivenUp).toBe(true);
    expect(giveUpHandler).toHaveBeenCalledTimes(1);
    expect(giveUpHandler.mock.calls[0][0].attempts).toBe(3);

    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it("reconnect() recovers from the given-up state and resets attempts", () => {
    const manager = createManager({ maxRetries: 1 });
    manager.connect();
    latest().open();

    latest().close(1006);
    vi.advanceTimersByTime(1000);
    latest().close(1006);
    expect(manager.state).toBe("given-up");

    manager.reconnect();

    expect(manager.state).toBe("connecting");
    expect(manager.reconnectAttempts).toBe(0);
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  // ── Intentional closes ────────────────────────────────────────────────────

  it("does not reconnect after a normal close (1000)", () => {
    const manager = createManager();
    manager.connect();
    latest().open();

    latest().close(1000);

    expect(manager.state).toBe("disconnected");
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("does not reconnect after an unauthorized close (4001)", () => {
    const manager = createManager();
    manager.connect();
    latest().open();

    latest().close(4001);

    expect(manager.state).toBe("disconnected");
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("disconnect() closes the socket and stops future attempts", () => {
    const manager = createManager();
    manager.connect();
    latest().open();

    manager.disconnect();

    expect(manager.state).toBe("disconnected");
    expect(latest().readyState).toBe(3);
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  // ── Tab backgrounded / foregrounded ───────────────────────────────────────

  it("flushes a pending reconnect when the tab becomes visible again", () => {
    const manager = createManager();
    manager.connect();
    latest().open();

    latest().close(1006);
    expect(manager.state).toBe("reconnecting");
    expect(MockWebSocket.instances).toHaveLength(1);

    // Timers are throttled while backgrounded, so the backoff has not fired yet.
    document.dispatchEvent(new Event("visibilitychange"));

    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("ignores visibility changes while hidden", () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });

    const manager = createManager();
    manager.connect();
    latest().open();
    latest().close(1006);

    document.dispatchEvent(new Event("visibilitychange"));
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  // ── send() ────────────────────────────────────────────────────────────────

  it("sends frames only while connected", () => {
    const manager = createManager();

    expect(manager.send("ping")).toBe(false);

    manager.connect();
    latest().open();

    expect(manager.send("ping")).toBe(true);
    expect(manager.send({ type: "ping" })).toBe(true);
    expect(latest().sent).toEqual(["ping", '{"type":"ping"}']);
  });

  // ── URL helper ────────────────────────────────────────────────────────────

  it("builds the token-authenticated socket URL", () => {
    expect(buildNotificationSocketUrl("wss://api.petad.dev/api/ws/notifications", "a b")).toBe(
      "wss://api.petad.dev/api/ws/notifications?token=a%20b",
    );
    expect(buildNotificationSocketUrl("ws://localhost/api/ws/notifications?x=1", "t")).toBe(
      "ws://localhost/api/ws/notifications?x=1&token=t",
    );
  });
});
