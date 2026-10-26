import type { WebSocketLike } from "../lib/realtime/notificationSocket";

/**
 * Minimal in-memory WebSocket double.
 *
 * Implements only the `WebSocketLike` surface the C4 connection manager
 * depends on, which is exactly what the injectable `WebSocketImpl` option
 * (and the global `WebSocket` stub) exists for. No `mock-socket` dependency is
 * required.
 */
export class MockWebSocket implements WebSocketLike {
  static instances: MockWebSocket[] = [];

  static reset(): void {
    MockWebSocket.instances = [];
  }

  static latest(): MockWebSocket {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }

  url: string;
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  /** Simulate a successful handshake. */
  open(): void {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  /** Simulate a server push. Objects are JSON-encoded like the real protocol. */
  receive(payload: unknown): void {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    this.onmessage?.({ data } as MessageEvent);
  }

  /** Simulate the server (or client) closing the socket. */
  close(code = 1000, reason = ""): void {
    this.readyState = 3;
    this.onclose?.({ code, reason, wasClean: code === 1000 } as CloseEvent);
  }

  send(data: string): void {
    this.sent.push(data);
  }
}
