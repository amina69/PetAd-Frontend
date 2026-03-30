import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationCentreDropdown } from "../NotificationCentreDropdown";
import type { Notification } from "../../../types/notifications";


const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQuery: (...args: unknown[]) => mockUseQuery(...args) };
});

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();

vi.mock("../../../hooks/useMutateMarkRead", () => ({
  useMutateMarkRead: () => ({ markRead: mockMarkRead, isPending: false, isError: false }),
}));

vi.mock("../../../hooks/useMutateMarkAllRead", () => ({
  useMutateMarkAllRead: () => ({ markAllRead: mockMarkAllRead, isPending: false, isError: false }),
}));

vi.mock("../index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../index")>();
  return {
    ...actual,
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
        data-testid={`notification-item-${notification.id}`}
        data-read={String(isRead)}
        onClick={() => onRead(notification.id)}
      >
        {notification.title}
      </div>
    ),
  };
});


const makeNotif = (overrides: Partial<Notification> = {}): Notification => ({
  id: "n1",
  type: "ESCROW_FUNDED",
  title: "Escrow Funded",
  message: "Your escrow is ready.",
  time: new Date().toISOString(),
  isRead: false,
  hasArrow: true,
  metadata: { resourceId: "adoption-001" },
  ...overrides,
});

const unreadNotif = makeNotif({ id: "n1", title: "Unread One", isRead: false });
const readNotif = makeNotif({ id: "n2", title: "Read One", isRead: true, type: "APPROVAL_REQUESTED" });

const defaultQueryResult = {
  data: { data: [unreadNotif, readNotif], nextCursor: null, total: 2 },
  isLoading: false,
  isError: false,
};


function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderDropdown(props: Partial<React.ComponentProps<typeof NotificationCentreDropdown>> = {}) {
  return render(<NotificationCentreDropdown {...props} />, { wrapper: createWrapper() });
}


describe("NotificationCentreDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(defaultQueryResult);
  });


  it("renders the bell button", () => {
    renderDropdown();
    expect(screen.getByTestId("bell-button")).toBeTruthy();
  });

  it("dropdown is closed by default", () => {
    renderDropdown();
    expect(screen.queryByTestId("notification-dropdown")).toBeNull();
  });

  it("bell button has aria-expanded=false when closed", () => {
    renderDropdown();
    expect(screen.getByTestId("bell-button").getAttribute("aria-expanded")).toBe("false");
  });


  it("opens dropdown on bell click", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByTestId("notification-dropdown")).toBeTruthy();
  });

  it("bell button has aria-expanded=true when open", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByTestId("bell-button").getAttribute("aria-expanded")).toBe("true");
  });

  it("closes dropdown on second bell click", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.queryByTestId("notification-dropdown")).toBeNull();
  });

  it("closes on outside click", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByTestId("notification-dropdown")).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId("notification-dropdown")).toBeNull();
  });

  it("closes on Escape key", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByTestId("notification-dropdown")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("notification-dropdown")).toBeNull();
  });


  it("dropdown has role='dialog'", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("dropdown has aria-label='Notifications'", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe("Notifications");
  });


  it("shows loading skeleton while fetching", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByLabelText("Loading notifications")).toBeTruthy();
  });


  it("renders notification items after load", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByText("Unread One")).toBeTruthy();
    expect(screen.getByText("Read One")).toBeTruthy();
  });

  it("passes correct isRead prop to each item", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByTestId("notification-item-n1").getAttribute("data-read")).toBe("false");
    expect(screen.getByTestId("notification-item-n2").getAttribute("data-read")).toBe("true");
  });


  it("shows unread badge with correct count", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByTestId("unread-badge").textContent).toBe("1");
  });

  it("hides unread badge when all are read", () => {
    mockUseQuery.mockReturnValue({
      data: { data: [{ ...unreadNotif, isRead: true }], nextCursor: null, total: 1 },
      isLoading: false,
      isError: false,
    });
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.queryByTestId("unread-badge")).toBeNull();
  });

  it("shows unread dot on bell when hasUnread prop is true", () => {
    renderDropdown({ hasUnread: true });
    expect(screen.getByTestId("unread-dot")).toBeTruthy();
  });


  it("shows empty state when no notifications", () => {
    mockUseQuery.mockReturnValue({
      data: { data: [], nextCursor: null, total: 0 },
      isLoading: false,
      isError: false,
    });
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.getByText("You're all caught up!")).toBeTruthy();
  });


  it("shows error state when fetch fails", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });


  it("shows 'Mark all read' button when there are unread notifications", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.getByTestId("mark-all-read-button")).toBeTruthy();
  });

  it("calls markAllRead when 'Mark all read' is clicked", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    fireEvent.click(screen.getByTestId("mark-all-read-button"));
    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("hides 'Mark all read' when no unread notifications", () => {
    mockUseQuery.mockReturnValue({
      data: { data: [{ ...unreadNotif, isRead: true }], nextCursor: null, total: 1 },
      isLoading: false,
      isError: false,
    });
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    expect(screen.queryByTestId("mark-all-read-button")).toBeNull();
  });


  it("calls markRead with notification id when item is clicked", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    fireEvent.click(screen.getByTestId("notification-item-n1"));
    expect(mockMarkRead).toHaveBeenCalledWith("n1");
  });

  it("closes dropdown after clicking a notification", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    fireEvent.click(screen.getByTestId("notification-item-n1"));
    expect(screen.queryByTestId("notification-dropdown")).toBeNull();
  });


  it("renders 'View all notifications' link", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    const link = screen.getByTestId("view-all-link");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/notifications");
  });

  it("closes dropdown when 'View all' is clicked", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    fireEvent.click(screen.getByTestId("view-all-link"));
    expect(screen.queryByTestId("notification-dropdown")).toBeNull();
  });


  it("ArrowDown moves focus to first item", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));
    const list = screen.getByTestId("notification-dropdown").querySelector("[data-notification-item]")?.parentElement;
    if (list) {
      fireEvent.keyDown(list, { key: "ArrowDown" });
    }
    const items = screen.getAllByTestId(/notification-item-/);
    expect(items.length).toBeGreaterThan(0);
  });

  it("Enter key on a focused item calls markRead and closes dropdown", () => {
    renderDropdown();
    fireEvent.click(screen.getByTestId("bell-button"));

    const dropdown = screen.getByTestId("notification-dropdown");
    const scrollContainer = dropdown.querySelector(".max-h-80") as HTMLElement;

    fireEvent.keyDown(scrollContainer, { key: "ArrowDown" });
    fireEvent.keyDown(scrollContainer, { key: "Enter" });

    expect(mockMarkRead).toHaveBeenCalledWith("n1");
    expect(screen.queryByTestId("notification-dropdown")).toBeNull();
  });
});