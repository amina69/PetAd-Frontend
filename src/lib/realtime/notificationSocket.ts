/**
 * C4 — Real-time connection manager.
 *
 * A thin, framework-agnostic wrapper around the native `WebSocket` used to
 * receive notification pushes. It centralises the connection lifecycle so the
 * React layer (C12) only has to render state instead of owning reconnection
 * timers.
 *
 * Responsibilities:
 *  - `connect()` / `disconnect()` / `on(event, handler)` lifecycle API
 *  - Automatic reconnect with exponential backoff (1s, 2s, 4s … capped at 30s)
 *  - A max-retry "give-up" state that surfaces to the UI
 *  - Guard against duplicate sockets when `connect()` is called repeatedly
 *  - Recover from throttled timers when a backgrounded tab regains focus
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/469
 */

/** Connection lifecycle as seen by consumers. */
export type NotificationSocketState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "given-up";

/**
 * Message envelope emitted by the notifications endpoint.
 *
 * @see docs/notifications.md — "Message Envelope Shape"
 */
export interface NotificationEnvelope<T = unknown> {
  eventId?: string;
  type: string;
  timestamp?: string;
  payload?: T;
  [key: string]: unknown;
}

/** Payload handed to every `on()` handler. */
export interface NotificationSocketEventPayload {
  /** Name of the event that fired (a lifecycle name or an envelope `type`). */
  event: string;
  /** Connection state at the moment the event fired. */
  state: NotificationSocketState;
  /** Number of consecutive failed reconnect attempts. */
  attempts: number;
  /** Populated for message events whose payload was a valid envelope. */
  envelope?: NotificationEnvelope;
  /** Raw message body when the payload was not a JSON envelope. */
  raw?: unknown;
  /** Present for `close` events — WebSocket close code. */
  code?: number;
  /** Present for `close` events — WebSocket close reason. */
  reason?: string;
  /** Present for `close` events — whether the close was clean. */
  wasClean?: boolean;
}

export type NotificationSocketHandler = (
  payload: NotificationSocketEventPayload,
) => void;

/**
 * The minimal surface this manager needs from a WebSocket implementation.
 *
 * Keeping it structural (instead of `typeof WebSocket`) lets tests supply a
 * lightweight mock without casting, while the default still uses the global
 * native implementation.
 */
export interface WebSocketLike {
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

/** Instantiable WebSocket implementation (native or mock). */
export type WebSocketConstructor = new (url: string) => WebSocketLike;

export interface NotificationSocketOptions {
  /** Fully-qualified socket URL, e.g. `ws://host/api/ws/notifications?token=…`. */
  url: string;
  /** Consecutive failed attempts before entering the `given-up` state. */
  maxRetries?: number;
  /** First reconnect delay; doubles on every attempt. */
  baseDelayMs?: number;
  /** Upper bound for the exponential backoff. */
  maxDelayMs?: number;
  /** Jitter factor in `[0, 1]` added on top of the backoff delay. */
  jitter?: number;
  /** Injectable WebSocket implementation (defaults to the global `WebSocket`). */
  WebSocketImpl?: WebSocketConstructor;
  /** Injectable timer functions so tests can drive time deterministically. */
  setTimeoutFn?: (handler: () => void, timeout: number) => ReturnType<typeof setTimeout>;
  clearTimeoutFn?: (id: ReturnType<typeof setTimeout>) => void;
  /** Injectable randomness used for jitter (defaults to `Math.random`). */
  random?: () => number;
  /**
   * Reconnect as soon as a backgrounded tab becomes visible / the browser comes
   * back online. Browsers throttle timers in background tabs, so without this
   * a pending reconnect could be delayed indefinitely. Defaults to `true`.
   */
  reconnectOnFocus?: boolean;
}

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BASE_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 30_000;
const DEFAULT_JITTER = 0;

/** WebSocket readyState values (avoids depending on the global constructor). */
const WS_CONNECTING = 0;
const WS_OPEN = 1;

/** Normal closure — an intentional close, never retried. */
const CLOSE_NORMAL = 1000;
/** Application code used when the token is missing/expired — never retried. */
const CLOSE_UNAUTHORIZED = 4001;

/**
 * Builds the notification socket URL expected by the backend.
 *
 * @see docs/notifications.md — token is passed as a query parameter.
 */
export function buildNotificationSocketUrl(baseUrl: string, token: string): string {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
}

/**
 * Manages a single notification WebSocket connection, including reconnection.
 *
 * @example
 * ```ts
 * const socket = createNotificationSocket({ url });
 * const off = socket.on("ESCROW_FUNDED", ({ envelope }) => {
 *   console.log(envelope?.payload);
 * });
 * socket.connect();
 * // later…
 * off();
 * socket.disconnect();
 * ```
 */
export class NotificationSocketManager {
  private url: string;
  private maxRetries: number;
  private baseDelayMs: number;
  private maxDelayMs: number;
  private jitter: number;
  private createSocket: (url: string) => WebSocketLike;
  private setTimeoutFn: (handler: () => void, timeout: number) => ReturnType<typeof setTimeout>;
  private clearTimeoutFn: (id: ReturnType<typeof setTimeout>) => void;
  private random: () => number;
  private reconnectOnFocus: boolean;

  private socket: WebSocketLike | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly handlers = new Map<string, Set<NotificationSocketHandler>>();
  private attempts = 0;
  private currentState: NotificationSocketState = "idle";
  private shouldReconnect = true;
  private disposed = false;
  private focusListenersAttached = false;

  constructor(options: NotificationSocketOptions) {
    this.url = options.url;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
    this.jitter = options.jitter ?? DEFAULT_JITTER;
    this.reconnectOnFocus = options.reconnectOnFocus ?? true;
    this.random = options.random ?? Math.random;
    this.setTimeoutFn = options.setTimeoutFn ?? ((handler, timeout) => setTimeout(handler, timeout));
    this.clearTimeoutFn = options.clearTimeoutFn ?? ((id) => clearTimeout(id));

    const Impl = options.WebSocketImpl;
    this.createSocket = Impl
      ? (url: string) => new Impl(url)
      : (url: string) => {
          const GlobalWebSocket = globalThis.WebSocket as
            | WebSocketConstructor
            | undefined;
          if (!GlobalWebSocket) {
            throw new Error("WebSocket is not available in this environment");
          }
          return new GlobalWebSocket(url);
        };
  }

  /** Current connection state. */
  get state(): NotificationSocketState {
    return this.currentState;
  }

  /** Number of consecutive failed reconnect attempts. */
  get reconnectAttempts(): number {
    return this.attempts;
  }

  /** True once the manager has exhausted its retry budget. */
  get isGivenUp(): boolean {
    return this.currentState === "given-up";
  }

  /**
   * Subscribe to a lifecycle event (`open`, `close`, `error`, `giveup`,
   * `statechange`, `message`) or to an envelope `type`
   * (e.g. `"ESCROW_FUNDED"`).
   *
   * @returns an unsubscribe function.
   */
  on(event: string, handler: NotificationSocketHandler): () => void {
    const existing = this.handlers.get(event);
    const set = existing ?? new Set<NotificationSocketHandler>();
    set.add(handler);
    if (!existing) {
      this.handlers.set(event, set);
    }

    return () => {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(event);
      }
    };
  }

  /**
   * Open the connection.
   *
   * Calling this while already `connecting` or `connected` is a no-op so the
   * manager never creates duplicate sockets.
   */
  connect(): void {
    if (this.disposed) return;
    if (this.currentState === "connecting" || this.currentState === "connected") {
      return;
    }
    if (this.hasLiveSocket()) return;

    this.clearReconnectTimer();
    this.attempts = 0;
    this.shouldReconnect = true;
    this.attachFocusListeners();
    this.openSocket();
  }

  /**
   * Trigger an immediate fresh connection attempt, resetting the retry budget.
   * Used by the "Reconnect" affordance surfaced to the user (C12).
   */
  reconnect(): void {
    if (this.disposed) return;
    this.attempts = 0;
    this.shouldReconnect = true;
    this.detachSocket();
    this.attachFocusListeners();
    this.openSocket();
  }

  /**
   * Close the connection and stop attempting to reconnect.
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.detachSocket();
    this.detachFocusListeners();
    this.setState("disconnected");
  }

  /**
   * Permanently tear the manager down. After this, `connect()` is a no-op and
   * no handlers or timers remain registered.
   */
  destroy(): void {
    this.disconnect();
    this.disposed = true;
    this.handlers.clear();
  }

  /** Send a payload over the socket. Returns `false` when not connected. */
  send(data: string | Record<string, unknown>): boolean {
    const socket = this.socket;
    if (!socket || socket.readyState !== WS_OPEN) {
      return false;
    }
    socket.send(typeof data === "string" ? data : JSON.stringify(data));
    return true;
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  private hasLiveSocket(): boolean {
    const socket = this.socket;
    if (!socket) return false;
    return socket.readyState === WS_CONNECTING || socket.readyState === WS_OPEN;
  }

  private openSocket(): void {
    if (this.disposed) return;
    if (this.hasLiveSocket()) return;

    this.clearReconnectTimer();
    this.setState(this.attempts > 0 ? "reconnecting" : "connecting");

    let socket: WebSocketLike;
    try {
      socket = this.createSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.socket = socket;
    socket.onopen = () => this.handleOpen();
    socket.onmessage = (event) => this.handleMessage(event);
    socket.onclose = (event) => this.handleClose(event);
    socket.onerror = () => {
      // `onerror` is always followed by `onclose`, which owns reconnection.
    };
  }

  private handleOpen(): void {
    this.attempts = 0;
    this.setState("connected");
    this.emit("open", {});
  }

  private handleMessage(event: MessageEvent): void {
    const raw: unknown = event.data;
    if (typeof raw !== "string") {
      this.emit("message", { raw });
      return;
    }

    let envelope: NotificationEnvelope | null = null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed !== null &&
        typeof parsed === "object" &&
        typeof (parsed as { type?: unknown }).type === "string"
      ) {
        envelope = parsed as NotificationEnvelope;
      }
    } catch {
      envelope = null;
    }

    if (!envelope) {
      this.emit("message", { raw });
      return;
    }

    this.emit("message", { envelope });
    this.emit(envelope.type, { envelope });
  }

  private handleClose(event: CloseEvent): void {
    this.socket = null;
    this.emit("close", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    if (!this.shouldReconnect || this.disposed) {
      this.setState("disconnected");
      return;
    }

    // Intentional / fatal closes are never retried.
    if (event.code === CLOSE_NORMAL || event.code === CLOSE_UNAUTHORIZED) {
      this.setState("disconnected");
      return;
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    this.attempts += 1;

    if (this.attempts > this.maxRetries) {
      this.setState("given-up");
      this.emit("giveup", {});
      return;
    }

    this.setState("reconnecting");
    const delay = this.computeBackoffDelay(this.attempts);
    this.reconnectTimer = this.setTimeoutFn(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  /** Exponential backoff: base * 2^(attempt-1), capped, plus optional jitter. */
  computeBackoffDelay(attempt: number): number {
    const exponential = Math.min(
      this.baseDelayMs * Math.pow(2, attempt - 1),
      this.maxDelayMs,
    );
    const jitter = this.jitter > 0 ? this.random() * this.jitter * exponential : 0;
    return Math.round(exponential + jitter);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      this.clearTimeoutFn(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private detachSocket(): void {
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;

    // Detach handlers first so an intentional close cannot schedule a reconnect.
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    try {
      socket.close(CLOSE_NORMAL, "client disconnect");
    } catch {
      // A socket that is already closing may throw — safe to ignore.
    }
  }

  private handleVisibilityChange = (): void => {
    if (typeof document === "undefined") return;
    if (document.visibilityState !== "visible") return;
    this.flushPendingReconnect();
  };

  private handleOnline = (): void => {
    this.flushPendingReconnect();
  };

  /**
   * If a reconnect is pending, run it immediately. Background tabs throttle
   * timers, so a pending backoff may not have fired when the user returns.
   */
  private flushPendingReconnect(): void {
    if (this.disposed || !this.shouldReconnect) return;
    if (this.reconnectTimer === null) return;
    this.openSocket();
  }

  private attachFocusListeners(): void {
    if (!this.reconnectOnFocus || this.focusListenersAttached) return;
    if (typeof document === "undefined") return;

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
    }
    this.focusListenersAttached = true;
  }

  private detachFocusListeners(): void {
    if (!this.focusListenersAttached) return;
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
    }
    this.focusListenersAttached = false;
  }

  private setState(next: NotificationSocketState): void {
    if (this.currentState === next) return;
    this.currentState = next;
    this.emit("statechange", {});
  }

  private emit(
    event: string,
    partial: Omit<
      NotificationSocketEventPayload,
      "event" | "state" | "attempts"
    >,
  ): void {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) return;

    const payload: NotificationSocketEventPayload = {
      event,
      state: this.currentState,
      attempts: this.attempts,
      ...partial,
    };
    handlers.forEach((handler) => handler(payload));
  }
}

/** Create a notification socket manager. */
export function createNotificationSocket(
  options: NotificationSocketOptions,
): NotificationSocketManager {
  return new NotificationSocketManager(options);
}
