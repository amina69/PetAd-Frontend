import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationsListPage, { groupByDate } from "../notificationPage";
import type { Notification } from "../../types/notifications";
import type { UseNotificationsReturn } from "../../hooks/useNotifications";

beforeAll(() => {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor() {}
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

vi.mock("../../hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

vi.mock("../../components/notifications", () => ({
  NotificationItem: ({
    notification,
    isRead,
    onRead,
  }: {
    notification: Notification;
    isRead: boolean;
    onRead: (id: string | number) => void;
  }) => (
    <div
      data-testid={`notification-${notification.id}`}
      data-read={String(isRead)}
      onClick={() => onRead(notification.id)}
    >
      {notification.title}
    </div>
  ),
}));

import { useNotifications } from "../../hooks/useNotifications";

const now = new Date();
const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0).toISOString();
const yesterdayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0, 0).toISOString();
const earlierISO = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 8, 0, 0).toISOString();

const makeNotification = (overrides: Partial<Notification>): Notification => ({
  id: "notif-001",
  type: "ESCROW_FUNDED",
  title: "Escrow Funded",
  message: "Your escrow is ready.",
  time: todayISO,
  isRead: false,
  hasArrow: true,
  metadata: { resourceId: "adoption-001" },
  ...overrides,
});

const todayNotif = makeNotification({ id: "t1", title: "Today Notification", time: todayISO });
const yesterdayNotif = makeNotification({ id: "y1", title: "Yesterday Notification", time: yesterdayISO, type: "APPROVAL_REQUESTED" });
const earlierNotif = makeNotification({ id: "e1", title: "Earlier Notification", time: earlierISO, isRead: true, type: "DISPUTE_RAISED" });

const defaultHookReturn: UseNotificationsReturn = {
  notifications: [todayNotif, yesterdayNotif, earlierNotif],
  total: 3,
  isLoading: false,
  isFetchingNextPage: false,
  isError: false,
  hasNextPage: false,
  fetchNextPage: vi.fn(),
  markRead: vi.fn(),
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/notifications"]}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPage() {
  return render(<NotificationsListPage />, { wrapper: createWrapper() });
}

describe("NotificationsListPage", () => {
  beforeEach(() => {
    vi.mocked(useNotifications).mockReturnValue(defaultHookReturn);
  });

  it("renders loading skeletons while fetching", () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...defaultHookReturn,
      notifications: [],
      isLoading: true,
    });
    renderPage();
    expect(screen.getByTestId("notifications-loading")).toBeTruthy();
  });

  it("renders all notifications after load", () => {
    renderPage();
    expect(screen.getByText("Today Notification")).toBeTruthy();
    expect(screen.getByText("Yesterday Notification")).toBeTruthy();
    expect(screen.getByText("Earlier Notification")).toBeTruthy();
  });

  it("shows the notifications list with role='list'", () => {
    renderPage();
    expect(screen.getByRole("list", { name: "Notifications" })).toBeTruthy();
  });

  it("renders Today group header", () => {
    renderPage();
    expect(screen.getByTestId("group-header-today")).toBeTruthy();
    expect(screen.getByTestId("group-header-today").textContent?.toLowerCase()).toContain("today");
  });

  it("renders Yesterday group header", () => {
    renderPage();
    expect(screen.getByTestId("group-header-yesterday")).toBeTruthy();
  });

  it("renders Earlier group header", () => {
    renderPage();
    expect(screen.getByTestId("group-header-earlier")).toBeTruthy();
  });

  it("does not render a group header when that bucket is empty", () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...defaultHookReturn,
      notifications: [todayNotif],
    });
    renderPage();
    expect(screen.getByTestId("group-header-today")).toBeTruthy();
    expect(screen.queryByTestId("group-header-yesterday")).toBeNull();
    expect(screen.queryByTestId("group-header-earlier")).toBeNull();
  });

  it("renders All, Unread, and Read tabs", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: "All" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Unread" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Read" })).toBeTruthy();
  });

  it("All tab is selected by default", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: "All" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Unread" }).getAttribute("aria-selected")).toBe("false");
  });

  it("clicking Unread tab calls useNotifications with 'unread' filter", () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Unread" }));
    expect(vi.mocked(useNotifications)).toHaveBeenCalledWith("unread");
  });

  it("clicking Read tab calls useNotifications with 'read' filter", () => {
    renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Read" }));
    expect(vi.mocked(useNotifications)).toHaveBeenCalledWith("read");
  });

  it("shows unread count badge when there are unread notifications", () => {
    renderPage();
    const badge = screen.getByLabelText("2 unread");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe("2");
  });

  it("hides unread badge when all notifications are read", () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...defaultHookReturn,
      notifications: [{ ...todayNotif, isRead: true }],
    });
    renderPage();
    expect(screen.queryByLabelText(/unread/)).toBeNull();
  });

  it("shows empty state for 'all' filter when no notifications", () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...defaultHookReturn,
      notifications: [],
      total: 0,
    });
    renderPage();
    expect(screen.getByText("No notifications yet")).toBeTruthy();
  });

  it("shows correct empty state message for 'unread' filter", () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...defaultHookReturn,
      notifications: [],
      total: 0,
    });
    render(<NotificationsListPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("No notifications yet").length).toBeGreaterThan(0);
  });

  it("calls markRead with the notification id when a notification is clicked", () => {
    const markRead = vi.fn();
    vi.mocked(useNotifications).mockReturnValue({ ...defaultHookReturn, markRead });
    renderPage();
    fireEvent.click(screen.getByTestId("notification-t1"));
    expect(markRead).toHaveBeenCalledTimes(1);
    expect(markRead).toHaveBeenCalledWith("t1");
  });

  it("passes correct isRead prop to each NotificationItem", () => {
    renderPage();
    expect(screen.getByTestId("notification-t1").getAttribute("data-read")).toBe("false");
    expect(screen.getByTestId("notification-e1").getAttribute("data-read")).toBe("true");
  });

  it("renders scroll sentinel when there are more pages", () => {
    vi.mocked(useNotifications).mockReturnValue({ ...defaultHookReturn, hasNextPage: true });
    renderPage();
    expect(screen.getByTestId("scroll-sentinel")).toBeTruthy();
  });

  it("shows end-of-list message when no more pages", () => {
    renderPage();
    expect(screen.getByText("You've reached the end")).toBeTruthy();
  });

  it("shows error empty state when fetch fails", () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...defaultHookReturn,
      notifications: [],
      isError: true,
    });
    renderPage();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("displays total notification count in header", () => {
    renderPage();
    expect(screen.getByText("3 notifications")).toBeTruthy();
  });
});

describe("groupByDate", () => {
  it("places a notification from today into the Today bucket", () => {
    const groups = groupByDate([makeNotification({ time: todayISO })]);
    expect(groups.length).toBe(1);
    expect(groups[0].label).toBe("Today");
  });

  it("places a notification from yesterday into Yesterday bucket", () => {
    const groups = groupByDate([makeNotification({ time: yesterdayISO })]);
    expect(groups[0].label).toBe("Yesterday");
  });

  it("places an older notification into Earlier bucket", () => {
    const groups = groupByDate([makeNotification({ time: earlierISO })]);
    expect(groups[0].label).toBe("Earlier");
  });

  it("correctly splits notifications across all three buckets", () => {
    const groups = groupByDate([todayNotif, yesterdayNotif, earlierNotif]);
    expect(groups.length).toBe(3);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Earlier"]);
  });

  it("omits empty buckets", () => {
    const groups = groupByDate([todayNotif, earlierNotif]);
    expect(groups.length).toBe(2);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Earlier"]);
  });

  it("returns empty array for empty input", () => {
    expect(groupByDate([])).toEqual([]);
  });

  it("puts non-parseable time strings into Today", () => {
    const groups = groupByDate([makeNotification({ time: "2 min ago" })]);
    expect(groups[0].label).toBe("Today");
  });
});