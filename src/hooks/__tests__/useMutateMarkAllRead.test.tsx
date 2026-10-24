import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { useMutateMarkAllRead } from "../useMutateMarkAllRead";
import type { Notification, NotificationsPage } from "../../types/notifications";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

const UNREAD_NOTIF: Notification = {
  id: "notif-1",
  type: "ESCROW_FUNDED",
  title: "Escrow Funded",
  message: "The escrow is ready.",
  time: new Date().toISOString(),
  isRead: false,
};

const UNREAD_NOTIF_2: Notification = {
  id: "notif-2",
  type: "APPROVAL_REQUESTED",
  title: "Approval Requested",
  message: "A new approval request is waiting.",
  time: new Date().toISOString(),
  isRead: false,
};

function seedPaginatedCache(
  queryClient: QueryClient,
  notifications: Notification[],
) {
  queryClient.setQueryData(["notifications", "all"], {
    pages: [
      {
        data: notifications,
        nextCursor: null,
        total: notifications.length,
      },
    ],
    pageParams: [undefined],
  });
}

function seedDropdownCache(
  queryClient: QueryClient,
  notifications: Notification[],
) {
  queryClient.setQueryData<NotificationsPage>(["notifications", "dropdown"], {
    data: notifications,
    nextCursor: null,
    total: notifications.length,
  });
}

describe("useMutateMarkAllRead", () => {
  beforeEach(() => {
    server.use(
      http.post("/api/notifications/read-all", () => {
        return HttpResponse.text("", { status: 204 });
      }),
    );
  });

  it("optimistically marks every notification as read before the API resolves", async () => {
    let resolveRequest: (() => void) | undefined;
    server.use(
      http.post("/api/notifications/read-all", () => {
        return new Promise<Response>((resolve) => {
          resolveRequest = () =>
            resolve(HttpResponse.text("", { status: 204 }));
        });
      }),
    );

    const { queryClient, wrapper } = createWrapper();
    seedPaginatedCache(queryClient, [UNREAD_NOTIF, UNREAD_NOTIF_2]);
    seedDropdownCache(queryClient, [UNREAD_NOTIF, UNREAD_NOTIF_2]);

    const { result } = renderHook(() => useMutateMarkAllRead(), { wrapper });

    act(() => {
      result.current.markAllRead();
    });

    // Optimistic flip should already be visible while the request is in flight.
    await waitFor(() => {
      const paginated = queryClient.getQueryData<{
        pages: NotificationsPage[];
      }>(["notifications", "all"]);
      expect(
        paginated?.pages[0].data.every((n) => n.isRead === true),
      ).toBe(true);
    });

    const dropdown = queryClient.getQueryData<NotificationsPage>([
      "notifications",
      "dropdown",
    ]);
    expect(dropdown?.data.every((n) => n.isRead === true)).toBe(true);

    await act(async () => {
      resolveRequest?.();
    });
  });

  it("rolls back the read flag when the API fails", async () => {
    let rejectRequest: ((reason?: unknown) => void) | undefined;
    server.use(
      http.post("/api/notifications/read-all", () => {
        return new Promise<Response>((_resolve, reject) => {
          rejectRequest = (reason) =>
            reject(
              new Error(
                `Failed to mark all notifications read: ${reason}`,
              ),
            );
        });
      }),
    );

    const { queryClient, wrapper } = createWrapper();
    seedPaginatedCache(queryClient, [UNREAD_NOTIF, UNREAD_NOTIF_2]);
    seedDropdownCache(queryClient, [UNREAD_NOTIF, UNREAD_NOTIF_2]);

    const { result } = renderHook(() => useMutateMarkAllRead(), { wrapper });

    act(() => {
      result.current.markAllRead();
    });

    // Confirm optimistic state was applied.
    await waitFor(() => {
      const paginated = queryClient.getQueryData<{
        pages: NotificationsPage[];
      }>(["notifications", "all"]);
      expect(
        paginated?.pages[0].data.every((n) => n.isRead === true),
      ).toBe(true);
    });

    await act(async () => {
      rejectRequest?.(new Error("server error"));
    });

    // Flag should be reverted to the pre-mutation state.
    await waitFor(() => {
      const paginated = queryClient.getQueryData<{
        pages: NotificationsPage[];
      }>(["notifications", "all"]);
      expect(
        paginated?.pages[0].data.every((n) => n.isRead === false),
      ).toBe(true);
    });

    const dropdown = queryClient.getQueryData<NotificationsPage>([
      "notifications",
      "dropdown",
    ]);
    expect(dropdown?.data.every((n) => n.isRead === false)).toBe(true);

    expect(result.current.isError).toBe(true);
    expect(result.current.error).not.toBeNull();
  });

  it("zeros the unread count immediately on optimistic update", async () => {
    let resolveRequest: (() => void) | undefined;
    server.use(
      http.post("/api/notifications/read-all", () => {
        return new Promise<Response>((resolve) => {
          resolveRequest = () =>
            resolve(HttpResponse.text("", { status: 204 }));
        });
      }),
    );

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData<number>(
      ["notification-unread-count"],
      5,
    );

    const { result } = renderHook(() => useMutateMarkAllRead(), { wrapper });

    act(() => {
      result.current.markAllRead();
    });

    // Unread count should be zeroed optimistically.
    expect(
      queryClient.getQueryData<number>(["notification-unread-count"]),
    ).toBe(0);

    await act(async () => {
      resolveRequest?.();
    });

    // After success the count stays at 0 (server confirmed all read).
    expect(
      queryClient.getQueryData<number>(["notification-unread-count"]),
    ).toBe(0);
  });
});
