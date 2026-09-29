import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockWebSocket } from "../../../../test/mockWebSocket";
import {
  useNotificationSocket,
  type UseNotificationSocketOptions,
} from "../useNotificationSocket";

const SOCKET_URL = "ws://localhost/api/ws/notifications";

type SocketOverrides = Partial<Omit<UseNotificationSocketOptions, "url">> & {
  url?: string | null;
};

function renderSocket(overrides: SocketOverrides = {}) {
  const { url = SOCKET_URL, ...rest } = overrides;
  const options: UseNotificationSocketOptions = {
    url,
    WebSocketImpl: MockWebSocket,
    maxRetries: 2,
    baseDelayMs: 1000,
    ...rest,
  };
  return renderHook(() => useNotificationSocket(options));
}

describe("useNotificationSocket (C4 integration / C12 state)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays idle when no url is provided", () => {
    const { result } = renderSocket({ url: null });

    expect(result.current.connectionState).toBe("idle");
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it("connects on mount and tracks the connection state", () => {
    const { result } = renderSocket();

    expect(result.current.connectionState).toBe("connecting");
    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      MockWebSocket.latest().open();
    });

    expect(result.current.connectionState).toBe("connected");
    expect(result.current.hasGivenUp).toBe(false);
    expect(result.current.reconnectAttempts).toBe(0);
  });

  it("surfaces the reconnecting state and retries after a forced disconnect", () => {
    const { result } = renderSocket();

    act(() => {
      MockWebSocket.latest().open();
    });

    act(() => {
      MockWebSocket.latest().close(1006);
    });

    expect(result.current.connectionState).toBe("reconnecting");
    expect(result.current.reconnectAttempts).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(MockWebSocket.instances).toHaveLength(2);

    act(() => {
      MockWebSocket.latest().open();
    });

    expect(result.current.connectionState).toBe("connected");
    expect(result.current.reconnectAttempts).toBe(0);
  });

  it("exposes hasGivenUp once the retry budget is exhausted", () => {
    const { result } = renderSocket({ maxRetries: 1 });

    act(() => {
      MockWebSocket.latest().open();
    });

    act(() => {
      MockWebSocket.latest().close(1006);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      MockWebSocket.latest().close(1006);
    });

    expect(result.current.connectionState).toBe("given-up");
    expect(result.current.hasGivenUp).toBe(true);

    // No further sockets are created after giving up.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("reconnect() recovers from the given-up state", () => {
    const { result } = renderSocket({ maxRetries: 1 });

    act(() => {
      MockWebSocket.latest().open();
    });
    act(() => {
      MockWebSocket.latest().close(1006);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      MockWebSocket.latest().close(1006);
    });
    expect(result.current.hasGivenUp).toBe(true);

    act(() => {
      result.current.reconnect();
    });

    expect(result.current.connectionState).toBe("connecting");
    expect(result.current.hasGivenUp).toBe(false);
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it("captures the most recent message envelope", () => {
    const { result } = renderSocket();

    act(() => {
      MockWebSocket.latest().open();
    });

    const envelope = { type: "APPROVAL_REQUESTED", payload: { id: "notif-1" } };
    act(() => {
      MockWebSocket.latest().receive(envelope);
    });

    expect(result.current.lastMessage).toEqual(envelope);
  });

  it("closes the socket on unmount", () => {
    const { unmount } = renderSocket();

    act(() => {
      MockWebSocket.latest().open();
    });

    unmount();

    expect(MockWebSocket.latest().readyState).toBe(3);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
