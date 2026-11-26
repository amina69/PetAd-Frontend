import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import {
  useAdoptionStatus,
  ADOPTION_STATUS_POLL_INTERVAL_MS,
} from "../useAdoptionStatus";
import { adoptionService } from "../../../../api/adoptionService";
import type { AdoptionDetails } from "../../../../types/adoption";
import { NotificationSocketProvider } from "../../../../context/NotificationSocketContext";

vi.mock("../../../../api/adoptionService", () => ({
  adoptionService: {
    getDetails: vi.fn(),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal WebSocket double mirroring the context's own test suite. */
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

  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }
}

function createWrapper(options: { withSocket?: boolean } = {}) {
  const { withSocket = false } = options;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {/* The hook reads live notifications from the shared socket context.
          `enabled={false}` keeps polling tests free of WebSocket traffic. */}
      <NotificationSocketProvider enabled={withSocket}>
        {children}
      </NotificationSocketProvider>
    </QueryClientProvider>
  );

  return { queryClient, wrapper };
}

const getDetailsMock = vi.mocked(adoptionService.getDetails);

/**
 * The status endpoint's runtime contract (Prisma Adoption model) is wider
 * than the legacy `AdoptionDetails` TS union, which is exactly the drift the
 * zod schema guards against. Cast so tests can feed backend-shaped payloads.
 */
function asDetails(payload: Record<string, unknown>): AdoptionDetails {
  return payload as unknown as AdoptionDetails;
}

/**
 * Flush pending timers scheduled by React Query.
 *
 * The interval tick fires the refetch, but React Query schedules its
 * observer notification from a timer that lands *at* the tick time — a
 * subsequent sub-millisecond advance is required for `result.current` to
 * reflect the refetched data.
 */
async function flushTimers(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("useAdoptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    MockWebSocket.instances = [];
    localStorage.clear();
  });

  describe("polling (30s interval)", () => {
    it("stops polling once the status becomes terminal (COMPLETED)", async () => {
      vi.useFakeTimers();

      getDetailsMock
        .mockResolvedValueOnce(asDetails({ id: "a1", status: "PENDING" }))
        .mockResolvedValue(asDetails({ id: "a1", status: "COMPLETED" }));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAdoptionStatus("a1"), { wrapper });

      // Initial fetch.
      await flushTimers();
      expect(getDetailsMock).toHaveBeenCalledTimes(1);
      expect(result.current.data?.status).toBe("PENDING");
      expect(result.current.isTerminal).toBe(false);

      // First poll tick — response is now terminal.
      await flushTimers(ADOPTION_STATUS_POLL_INTERVAL_MS);
      expect(getDetailsMock).toHaveBeenCalledTimes(2);
      expect(result.current.data?.status).toBe("COMPLETED");
      expect(result.current.isTerminal).toBe(true);

      // Time keeps passing: no further requests are issued.
      await flushTimers(ADOPTION_STATUS_POLL_INTERVAL_MS * 4);
      expect(getDetailsMock).toHaveBeenCalledTimes(2);
    });

    it("keeps polling every 30s while the status is non-terminal", async () => {
      vi.useFakeTimers();

      getDetailsMock.mockResolvedValue(asDetails({ id: "a1", status: "PENDING" }));

      const { wrapper } = createWrapper();
      renderHook(() => useAdoptionStatus("a1"), { wrapper });

      await flushTimers();
      expect(getDetailsMock).toHaveBeenCalledTimes(1);

      await flushTimers(ADOPTION_STATUS_POLL_INTERVAL_MS);
      expect(getDetailsMock).toHaveBeenCalledTimes(2);

      await flushTimers(ADOPTION_STATUS_POLL_INTERVAL_MS);
      expect(getDetailsMock).toHaveBeenCalledTimes(3);
    });

    it("also stops polling at the terminal REJECTED status", async () => {
      vi.useFakeTimers();

      getDetailsMock
        .mockResolvedValueOnce(asDetails({ id: "a1", status: "PENDING" }))
        .mockResolvedValue(
          asDetails({
            id: "a1",
            status: "REJECTED",
            decisionReason: "Incomplete application.",
          }),
        );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAdoptionStatus("a1"), { wrapper });

      await flushTimers();
      expect(getDetailsMock).toHaveBeenCalledTimes(1);

      await flushTimers(ADOPTION_STATUS_POLL_INTERVAL_MS);
      expect(result.current.isTerminal).toBe(true);
      expect(result.current.data?.decisionReason).toBe("Incomplete application.");

      await flushTimers(ADOPTION_STATUS_POLL_INTERVAL_MS * 4);
      expect(getDetailsMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("live-notification refetch", () => {
    it("refetches when a notification matching this adoption arrives", async () => {
      localStorage.setItem("auth_token", "test-token");
      vi.stubGlobal("WebSocket", MockWebSocket);

      getDetailsMock.mockResolvedValue(asDetails({ id: "a1", status: "PENDING" }));

      const { wrapper } = createWrapper({ withSocket: true });
      renderHook(() => useAdoptionStatus("a1"), { wrapper });

      await waitFor(() => expect(getDetailsMock).toHaveBeenCalledTimes(1));

      act(() => {
        MockWebSocket.instances[0]?.simulateOpen();
        MockWebSocket.instances[0]?.simulateMessage(
          JSON.stringify({
            type: "ESCROW_FUNDED",
            payload: {
              title: "Escrow funded",
              message: "Escrow for your adoption was funded.",
              metadata: { resourceId: "a1" },
            },
          }),
        );
      });

      await waitFor(() => expect(getDetailsMock).toHaveBeenCalledTimes(2));
    });

    it("does not refetch for notifications about other entities", async () => {
      localStorage.setItem("auth_token", "test-token");
      vi.stubGlobal("WebSocket", MockWebSocket);

      getDetailsMock.mockResolvedValue(asDetails({ id: "a1", status: "PENDING" }));

      const { wrapper } = createWrapper({ withSocket: true });
      renderHook(() => useAdoptionStatus("a1"), { wrapper });

      await waitFor(() => expect(getDetailsMock).toHaveBeenCalledTimes(1));

      act(() => {
        MockWebSocket.instances[0]?.simulateOpen();
        MockWebSocket.instances[0]?.simulateMessage(
          JSON.stringify({
            type: "DISPUTE_RAISED",
            payload: {
              title: "Dispute raised",
              message: "A dispute was raised elsewhere.",
              metadata: { resourceId: "other-adoption" },
            },
          }),
        );
      });

      // Give the effect a chance to run; the call count must not grow.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(getDetailsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("response validation", () => {
    it("surfaces an error when the payload violates the status schema", async () => {
      vi.useFakeTimers();

      // Status outside the agreed backend contract.
      getDetailsMock.mockResolvedValue(asDetails({ id: "a1", status: "TELEPORTED" }));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAdoptionStatus("a1"), { wrapper });

      await flushTimers();

      expect(result.current.isError).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });
});
