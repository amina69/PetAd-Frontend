import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationBell } from "../NotificationBell";
import { useNotificationCount } from "../../../lib/hooks/useNotificationCount";
import { NotificationSocketProvider } from "../../../context/NotificationSocketContext";

vi.mock("../../../lib/hooks/useNotificationCount");

const mockUseNotificationCount = vi.mocked(useNotificationCount);

function renderWithProvider(
  ui: React.ReactElement,
  initialState: "connected" | "disconnected" | "reconnecting" = "connected",
) {
  return render(
    <NotificationSocketProvider initialState={initialState} enabled={false}>
      {ui}
    </NotificationSocketProvider>,
  );
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotificationCount.mockReturnValue({ count: 0, isLoading: false });
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    renderWithProvider(<NotificationBell onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows badge with exact count when count is between 1 and 9", () => {
    mockUseNotificationCount.mockReturnValue({ count: 7, isLoading: false });
    renderWithProvider(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByTestId("notification-bell-badge")).toHaveTextContent("7");
  });

  it('caps badge display at "9+" when count is 10 or more', () => {
    mockUseNotificationCount.mockReturnValue({ count: 10, isLoading: false });
    const { rerender } = renderWithProvider(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByTestId("notification-bell-badge")).toHaveTextContent("9+");

    mockUseNotificationCount.mockReturnValue({ count: 42, isLoading: false });
    rerender(
      <NotificationSocketProvider initialState="connected" enabled={false}>
        <NotificationBell onClick={vi.fn()} />
      </NotificationSocketProvider>,
    );
    expect(screen.getByTestId("notification-bell-badge")).toHaveTextContent("9+");
  });

  it("hides badge when count is 0", () => {
    renderWithProvider(<NotificationBell onClick={vi.fn()} />);
    expect(screen.queryByTestId("notification-bell-badge")).toBeNull();
  });

  it('uses aria-label "Notifications, N unread" when connected', () => {
    mockUseNotificationCount.mockReturnValue({ count: 1, isLoading: false });
    renderWithProvider(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Notifications, 1 unread",
    );
  });

  it("includes connection state in aria-label when not connected", () => {
    mockUseNotificationCount.mockReturnValue({ count: 1, isLoading: false });
    renderWithProvider(<NotificationBell onClick={vi.fn()} />, "reconnecting");
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Notifications, 1 unread, connection reconnecting",
    );
  });

  it("applies bell animation class when unread count increases", () => {
    mockUseNotificationCount.mockReturnValue({ count: 1, isLoading: false });
    const { rerender } = renderWithProvider(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByTestId("notification-bell-icon-wrap").className).not.toContain(
      "animate-notification-bell",
    );

    mockUseNotificationCount.mockReturnValue({ count: 2, isLoading: false });
    rerender(
      <NotificationSocketProvider initialState="connected" enabled={false}>
        <NotificationBell onClick={vi.fn()} />
      </NotificationSocketProvider>,
    );
    expect(screen.getByTestId("notification-bell-icon-wrap").className).toContain(
      "animate-notification-bell",
    );
  });

  it("shows green indicator when connected", () => {
    renderWithProvider(<NotificationBell onClick={vi.fn()} />, "connected");
    const indicator = screen.getByTestId("connection-indicator");
    expect(indicator.className).toContain("bg-green-500");
  });

  it("shows amber pulsing indicator when reconnecting", () => {
    renderWithProvider(<NotificationBell onClick={vi.fn()} />, "reconnecting");
    const indicator = screen.getByTestId("connection-indicator");
    expect(indicator.className).toContain("bg-amber-500");
    expect(indicator.className).toContain("animate-pulse");
  });

  it("shows red indicator when disconnected", () => {
    renderWithProvider(<NotificationBell onClick={vi.fn()} />, "disconnected");
    const indicator = screen.getByTestId("connection-indicator");
    expect(indicator.className).toContain("bg-red-500");
  });
});
