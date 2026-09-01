import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NotificationSocketProvider,
  useNotificationSocket,
} from "../NotificationSocketContext";

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  readyState = 0;
  url: string;

  constructor(url: string) {
    this.url = url;
    this.readyState = 1; // OPEN
    MockWebSocket.instances.push(this);
  }

  close(code = 1000) {
    this.readyState = 3; // CLOSED
    this.onclose?.({ code });
  }

  simulateOpen() {
    this.onopen?.();
  }

  simulateClose(code = 1000) {
    this.onclose?.({ code });
  }
}

// Helper component to read context values
function ConnectionReader() {
  const { connectionState, reconnectAttempts, reconnect } = useNotificationSocket();
  return (
    <div>
      <span data-testid="state">{connectionState}</span>
      <span data-testid="attempts">{reconnectAttempts}</span>
      <button data-testid="reconnect" onClick={reconnect}>
        Reconnect
      </button>
    </div>
  );
}

describe("NotificationSocketContext", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
    // Set a fake auth token
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => (key === "auth_token" ? "test-token" : null)),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in disconnected state when no token is available", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });

    render(
      <NotificationSocketProvider>
        <ConnectionReader />
      </NotificationSocketProvider>,
    );

    expect(screen.getByTestId("state")).toHaveTextContent("disconnected");
  });

  it("starts in the provided initial state for testing", () => {
    render(
      <NotificationSocketProvider initialState="connected">
        <ConnectionReader />
      </NotificationSocketProvider>,
    );

    expect(screen.getByTestId("state")).toHaveTextContent("connected");
  });

  it("shows reconnecting state when WebSocket closes abnormally", () => {
    render(
      <NotificationSocketProvider>
        <ConnectionReader />
      </NotificationSocketProvider>,
    );

    // Simulate abnormal close
    act(() => {
      const ws = MockWebSocket.instances[0];
      ws?.simulateClose(1006); // Abnormal closure
    });

    expect(screen.getByTestId("state")).toHaveTextContent("reconnecting");
  });

  it("shows disconnected state when WebSocket closes normally", () => {
    render(
      <NotificationSocketProvider>
        <ConnectionReader />
      </NotificationSocketProvider>,
    );

    // Simulate normal close
    act(() => {
      const ws = MockWebSocket.instances[0];
      ws?.simulateClose(1000); // Normal closure
    });

    expect(screen.getByTestId("state")).toHaveTextContent("disconnected");
  });

  it("shows disconnected state when unauthorized (code 4001)", () => {
    render(
      <NotificationSocketProvider>
        <ConnectionReader />
      </NotificationSocketProvider>,
    );

    // Simulate unauthorized close
    act(() => {
      const ws = MockWebSocket.instances[0];
      ws?.simulateClose(4001);
    });

    expect(screen.getByTestId("state")).toHaveTextContent("disconnected");
  });

  it("reconnect button resets state and attempts reconnection", () => {
    render(
      <NotificationSocketProvider>
        <ConnectionReader />
      </NotificationSocketProvider>,
    );

    // First connect
    act(() => {
      MockWebSocket.instances[0]?.simulateOpen();
    });
    expect(screen.getByTestId("state")).toHaveTextContent("connected");

    // Simulate abnormal close
    act(() => {
      MockWebSocket.instances[0]?.simulateClose(1006);
    });
    expect(screen.getByTestId("state")).toHaveTextContent("reconnecting");

    // Click reconnect
    act(() => {
      screen.getByTestId("reconnect").click();
    });

    expect(screen.getByTestId("state")).toHaveTextContent("reconnecting");
    expect(screen.getByTestId("attempts")).toHaveTextContent("0");
  });

  it("throws when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BadComponent() {
      useNotificationSocket();
      return null;
    }

    expect(() => render(<BadComponent />)).toThrow(
      "useNotificationSocket must be used within a NotificationSocketProvider",
    );

    consoleSpy.mockRestore();
  });

  it("does not attempt connection when enabled is false", () => {
    render(
      <NotificationSocketProvider enabled={false}>
        <ConnectionReader />
      </NotificationSocketProvider>,
    );

    // Should stay disconnected since connection is disabled
    expect(screen.getByTestId("state")).toHaveTextContent("disconnected");
    // No WebSocket instances should have been created
    expect(MockWebSocket.instances).toHaveLength(0);
  });
});
