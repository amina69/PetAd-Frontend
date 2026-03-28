import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, render, waitFor, act, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { useNotificationCount } from "../useNotificationCount";
import { apiClient } from "../../api-client";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe("useNotificationCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the unread notification count and loading state", async () => {
    const queryClient = createTestQueryClient();
    vi.spyOn(apiClient, "get").mockResolvedValue({ count: 7 });

    const { result } = renderHook(() => useNotificationCount(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.count).toBe(7));
    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/notifications?status=UNREAD&limit=0");
  });

  it("pauses polling when document is hidden", async () => {
    const queryClient = createTestQueryClient();

    Object.defineProperty(document, "hidden", {
      writable: true,
      configurable: true,
      value: false,
    });

    const fetchFn = vi.spyOn(apiClient, "get").mockResolvedValue({ count: 3 });

    renderHook(() => useNotificationCount(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    vi.useFakeTimers();

    await act(async () => {
      Object.defineProperty(document, "hidden", { value: true });
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(120000);
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("resets unread count to 0 when the notification centre opens", async () => {
    const queryClient = createTestQueryClient();
    vi.spyOn(apiClient, "get").mockResolvedValue({ count: 5 });
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({});

    let navigateToNotifications: (() => void) | null = null;

    function NotificationCountTester() {
      const { count } = useNotificationCount();
      const navigate = useNavigate();

      useEffect(() => {
        navigateToNotifications = () => navigate("/notifications");
      }, [navigate]);

      return <div data-testid="notification-count">{count}</div>;
    }

    render(<NotificationCountTester />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(screen.getByTestId("notification-count").textContent).toBe("5"));

    act(() => {
      navigateToNotifications?.();
    });

    await waitFor(() => expect(postSpy).toHaveBeenCalledWith("/notifications/read-all"));
    await waitFor(() => expect(screen.getByTestId("notification-count").textContent).toBe("0"));
  });
});
