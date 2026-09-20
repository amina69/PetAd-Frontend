export type NotificationSocketStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export type NotificationSocketEvent =
  | "connect"
  | "disconnect"
  | "message"
  | "error"
  | "reconnect"
  | "giveup";

export interface NotificationSocketOptions {
  url: string;
  WebSocketCtor?: typeof WebSocket;
  maxRetries?: number;
  initialRetryDelayMs?: number;
  maxRetryDelayMs?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface NotificationMessage {
  type?: string;
  [key: string]: unknown;
}

export type NotificationSocketHandler<T = NotificationMessage> = (payload: T) => void;

export class NotificationSocket {
  private readonly url: string;
  private readonly WebSocketCtor: typeof WebSocket;
  private readonly maxRetries: number;
  private readonly initialRetryDelayMs: number;
  private readonly maxRetryDelayMs: number;
  private readonly onConnect?: () => void;
  private readonly onDisconnect?: () => void;

  private socket: WebSocket | null = null;
  private statusState: NotificationSocketStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private isManualDisconnect = false;
  private handlers: Partial<Record<NotificationSocketEvent, Set<Function>>> = {};

  constructor(options: NotificationSocketOptions) {
    this.url = options.url;
    this.WebSocketCtor = options.WebSocketCtor ?? WebSocket;
    this.maxRetries = options.maxRetries ?? 5;
    this.initialRetryDelayMs = options.initialRetryDelayMs ?? 1000;
    this.maxRetryDelayMs = options.maxRetryDelayMs ?? 30000;
    this.onConnect = options.onConnect;
    this.onDisconnect = options.onDisconnect;

    if (typeof window !== "undefined") {
      window.addEventListener("focus", this.handleWindowFocus);
    }
  }

  get status(): NotificationSocketStatus {
    return this.statusState;
  }

  connect(): void {
    if (this.socket && (this.statusState === "connecting" || this.statusState === "connected")) {
      return;
    }

    if (this.statusState === "failed" || this.statusState === "disconnected" || this.isManualDisconnect) {
      this.reconnectAttempts = 0;
    }

    this.isManualDisconnect = false;
    this.shouldReconnect = true;
    this.statusState = "connecting";
    this.clearReconnectTimer();

    try {
      const ws = new this.WebSocketCtor(this.url);
      this.socket = ws;
      ws.onopen = () => {
        this.statusState = "connected";
        this.onConnect?.();
        this.emit("connect");
      };
      ws.onmessage = (event: MessageEvent) => {
        const payload = this.parseMessage(event.data);
        this.emit("message", payload);
      };
      ws.onerror = () => {
        this.statusState = this.statusState === "connected" ? "reconnecting" : this.statusState;
        this.emit("error");
      };
      ws.onclose = () => {
        this.socket = null;

        if (this.isManualDisconnect) {
          this.statusState = "disconnected";
          this.emit("disconnect");
          this.onDisconnect?.();
          return;
        }

        this.handleConnectionLoss();
      };
    } catch {
      this.handleConnectionLoss();
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.shouldReconnect = false;
    this.clearReconnectTimer();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.statusState = "disconnected";
    this.emit("disconnect");
    this.onDisconnect?.();
  }

  on<T = NotificationMessage>(event: NotificationSocketEvent, handler: NotificationSocketHandler<T>): void {
    if (!this.handlers[event]) {
      this.handlers[event] = new Set();
    }

    this.handlers[event]!.add(handler as Function);
  }

  private handleConnectionLoss(): void {
    if (!this.shouldReconnect) {
      this.statusState = "disconnected";
      return;
    }

    this.statusState = "reconnecting";
    this.reconnectAttempts += 1;

    if (this.reconnectAttempts > this.maxRetries) {
      this.statusState = "failed";
      this.emit("giveup");
      return;
    }

    const delay = this.getRetryDelay(this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.emit("reconnect");
      this.connect();
    }, delay);
  }

  private handleWindowFocus = () => {
    if (
      this.statusState === "failed" ||
      this.statusState === "disconnected" ||
      (this.statusState === "reconnecting" && !this.socket)
    ) {
      this.connect();
    }
  };

  private getRetryDelay(attempt: number): number {
    const delay = this.initialRetryDelayMs * 2 ** (attempt - 1);
    return Math.min(delay, this.maxRetryDelayMs);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private parseMessage(data: unknown): NotificationMessage {
    if (typeof data === "string") {
      try {
        return JSON.parse(data) as NotificationMessage;
      } catch {
        return { raw: data };
      }
    }

    if (data && typeof data === "object") {
      return data as NotificationMessage;
    }

    return { raw: data };
  }

  private emit(event: NotificationSocketEvent, payload?: NotificationMessage): void {
    const handlers = this.handlers[event];
    if (!handlers) return;

    for (const handler of handlers) {
      if (payload !== undefined) {
        handler(payload);
      } else {
        handler();
      }
    }
  }
}
