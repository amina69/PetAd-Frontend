import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationSocket } from "../notificationSocket";

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  private listeners: Record<string, Array<(event: Event | MessageEvent | CloseEvent) => void>>;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.listeners = {
      open: [],
      message: [],
      error: [],
      close: [],
    };
    MockWebSocket.instances.push(this);

    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.dispatchEvent(new Event("open"));
    });
  }

  addEventListener(event: string, handler: (event: Event | MessageEvent | CloseEvent) => void) {
    this.listeners[event]?.push(handler);
  }

  removeEventListener(event: string, handler: (event: Event | MessageEvent | CloseEvent) => void) {
    this.listeners[event] = this.listeners[event]?.filter((fn) => fn !== handler) ?? [];
  }

  dispatchEvent(event: Event | MessageEvent | CloseEvent) {
    const listeners = this.listeners[event.type] ?? [];
    listeners.forEach((handler) => handler(event));

    if (event.type === "open" && this.onopen) this.onopen(event as Event);
    if (event.type === "message" && this.onmessage) this.onmessage(event as MessageEvent);
    if (event.type === "error" && this.onerror) this.onerror(event as Event);
    if (event.type === "close" && this.onclose) this.onclose(event as CloseEvent);
  }

  send(data: string) {
    void data;
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent("close", { code: 1000, wasClean: true }));
  }

  triggerMessage(payload: unknown) {
    this.dispatchEvent(new MessageEvent("message", {
      data: typeof payload === "string" ? payload : JSON.stringify(payload),
    }));
  }

  triggerClose() {
    this.close();
  }
}

describe("NotificationSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("connects successfully and receives a message", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const socket = new NotificationSocket({
      url: "ws://example.test/notifications",
      WebSocketCtor: MockWebSocket as unknown as typeof WebSocket,
    });
    const onMessage = vi.fn();

    socket.on("message", onMessage);
    socket.connect();

    await Promise.resolve();

    expect(socket.status).toBe("connected");
    expect(MockWebSocket.instances).toHaveLength(1);

    MockWebSocket.instances[0].triggerMessage({ type: "notification", id: "n-42" });

    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "notification", id: "n-42" }),
    );
  });

  it("does not duplicate a connection while already connected or connecting", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const socket = new NotificationSocket({
      url: "ws://example.test/notifications",
      WebSocketCtor: MockWebSocket as unknown as typeof WebSocket,
    });

    socket.connect();
    socket.connect();
    await Promise.resolve();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(socket.status).toBe("connected");
  });

  it("reconnects after a manual disconnect and reconnect call", async () => {
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const socket = new NotificationSocket({
      url: "ws://example.test/notifications",
      WebSocketCtor: MockWebSocket as unknown as typeof WebSocket,
    });

    socket.connect();
    await Promise.resolve();
    socket.disconnect();

    expect(socket.status).toBe("disconnected");

    socket.connect();
    await Promise.resolve();

    expect(MockWebSocket.instances).toHaveLength(2);
    expect(socket.status).toBe("connected");
  });

  it("gives up after the configured max retries", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const socket = new NotificationSocket({
      url: "ws://example.test/notifications",
      WebSocketCtor: MockWebSocket as unknown as typeof WebSocket,
      maxRetries: 2,
      initialRetryDelayMs: 100,
      maxRetryDelayMs: 200,
    });
    const onGiveUp = vi.fn();

    socket.on("giveup", onGiveUp);
    socket.connect();
    await Promise.resolve();

    const first = MockWebSocket.instances[0];
    first.triggerClose();
    await vi.advanceTimersByTimeAsync(100);

    expect(MockWebSocket.instances).toHaveLength(2);

    const second = MockWebSocket.instances[1];
    second.triggerClose();
    await vi.advanceTimersByTimeAsync(200);

    expect(MockWebSocket.instances).toHaveLength(3);

    const third = MockWebSocket.instances[2];
    third.triggerClose();

    expect(socket.status).toBe("failed");
    expect(onGiveUp).toHaveBeenCalled();
  });

  it("reconnects again when the browser regains focus", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);

    const socket = new NotificationSocket({
      url: "ws://example.test/notifications",
      WebSocketCtor: MockWebSocket as unknown as typeof WebSocket,
      initialRetryDelayMs: 100,
      maxRetryDelayMs: 200,
    });

    socket.connect();
    await Promise.resolve();

    const first = MockWebSocket.instances[0];
    first.triggerClose();
    await vi.advanceTimersByTimeAsync(100);

    const second = MockWebSocket.instances[1];
    expect(second).toBeDefined();
    second.triggerClose();

    window.dispatchEvent(new Event("focus"));
    await Promise.resolve();

    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2);
    expect(socket.status).not.toBe("failed");
  });
});
