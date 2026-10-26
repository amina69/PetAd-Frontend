import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { notificationService } from "../../../../api/notificationService";
import { useMarkNotificationRead } from "../useMarkNotificationRead";
import type { Notification, NotificationsPage } from "../../../../types/notifications";

vi.mock("../../../../api/notificationService", () => ({
  notificationService: {
    markAsRead: vi.fn(),
  },
}));

const mockMarkAsRead = vi.mocked(notificationService.markAsRead);

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

const READ_NOTIF: Notification = {
  id: "notif-2",
  type: "APPROVAL_REQUESTED",
  title: "Approval Requested",
  message: "A new approval request is waiting.",
  time: new Date().toISOString(),
  isRead: true,
};

function seedPaginatedCache(
  queryClient: QueryClient,
  notifications: Notification[],
) {
  queryClient.setQueryData(["notifications", "all"], {
    pages: [{ data: notifications, nextCursor: null, total: notifications.length }],
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

describe("useMarkNotificationRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("optimistically marks the notification as read before the API resolves", async () => {
    let resolveRequest: (() => void) | undefined;
    mockMarkAsRead.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const { queryClient, wrapper } = createWrapper();
    seedPaginatedCache(queryClient, [UNREAD_NOTIF, READ_NOTIF]);
    seedDropdownCache(queryClient, [UNREAD_NOTIF, READ_NOTIF]);

    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });

    act(() => {
      result.current.markAsRead(UNREAD_NOTIF.id);
    });

    // While the request is in flight, the cache should already show isRead: true.
    await waitFor(() => {
      const paginated = queryClient.getQueryData<{
        pages: NotificationsPage[];
      }>(["notifications", "all"]);
      const updated = paginated?.pages[0].data.find(
        (n) => String(n.id) === String(UNREAD_NOTIF.id),
      );
      expect(updated?.isRead).toBe(true);
    });

    const dropdown = queryClient.getQueryData<NotificationsPage>([
      "notifications",
      "dropdown",
    ]);
    expect(
      dropdown?.data.find((n) => String(n.id) === String(UNREAD_NOTIF.id))?.isRead,
    ).toBe(true);

    expect(mockMarkAsRead).toHaveBeenCalledWith(UNREAD_NOTIF.id);

    await act(async () => {
      resolveRequest?.();
    });
  });

  it("rolls back the read flag and surfaces an inline error when the API fails", async () => {
    let rejectRequest: ((reason?: unknown) => void) | undefined;
    mockMarkAsRead.mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );

    const { queryClient, wrapper } = createWrapper();
    seedPaginatedCache(queryClient, [UNREAD_NOTIF, READ_NOTIF]);
    seedDropdownCache(queryClient, [UNREAD_NOTIF, READ_NOTIF]);

    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });

    act(() => {
      result.current.markAsRead(UNREAD_NOTIF.id);
    });

    // Confirm optimistic state was applied.
    await waitFor(() => {
      const paginated = queryClient.getQueryData<{
        pages: NotificationsPage[];
      }>(["notifications", "all"]);
      const updated = paginated?.pages[0].data.find(
        (n) => String(n.id) === String(UNREAD_NOTIF.id),
      );
      expect(updated?.isRead).toBe(true);
    });

    await act(async () => {
      rejectRequest?.(new Error("network error"));
    });

    // Flag should be reverted and the error surfaced for inline display.
    await waitFor(() => {
      const paginated = queryClient.getQueryData<{
        pages: NotificationsPage[];
      }>(["notifications", "all"]);
      const reverted = paginated?.pages[0].data.find(
        (n) => String(n.id) === String(UNREAD_NOTIF.id),
      );
      expect(reverted?.isRead).toBe(false);
    });

    const dropdown = queryClient.getQueryData<NotificationsPage>([
      "notifications",
      "dropdown",
    ]);
    expect(
      dropdown?.data.find((n) => String(n.id) === String(UNREAD_NOTIF.id))?.isRead,
    ).toBe(false);

    expect(result.current.isError).toBe(true);
    expect(result.current.error).not.toBeNull();
  });
});
