import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationBell } from "../NotificationBell";
import { useNotificationCount } from "../../../lib/hooks/useNotificationCount";

vi.mock("../../../lib/hooks/useNotificationCount");

const mockUseNotificationCount = vi.mocked(useNotificationCount);

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotificationCount.mockReturnValue({ count: 0, isLoading: false });
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<NotificationBell onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows badge with exact count when count is between 1 and 9", () => {
    mockUseNotificationCount.mockReturnValue({ count: 7, isLoading: false });
    render(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByTestId("notification-bell-badge")).toHaveTextContent("7");
  });

  it('caps badge display at "9+" when count is 10 or more', () => {
    mockUseNotificationCount.mockReturnValue({ count: 10, isLoading: false });
    const { rerender } = render(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByTestId("notification-bell-badge")).toHaveTextContent("9+");

    mockUseNotificationCount.mockReturnValue({ count: 42, isLoading: false });
    rerender(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByTestId("notification-bell-badge")).toHaveTextContent("9+");
  });

  it("hides badge when count is 0", () => {
    render(<NotificationBell onClick={vi.fn()} />);
    expect(screen.queryByTestId("notification-bell-badge")).toBeNull();
  });

  it('uses aria-label "Notifications, N unread"', () => {
    mockUseNotificationCount.mockReturnValue({ count: 1, isLoading: false });
    const { rerender } = render(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Notifications, 1 unread",
    );

    mockUseNotificationCount.mockReturnValue({ count: 4, isLoading: false });
    rerender(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Notifications, 4 unread",
    );
  });

  it("applies bell animation class when unread count increases", () => {
    mockUseNotificationCount.mockReturnValue({ count: 1, isLoading: false });
    const { rerender } = render(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByTestId("notification-bell-icon-wrap").className).not.toContain(
      "animate-notification-bell",
    );

    mockUseNotificationCount.mockReturnValue({ count: 2, isLoading: false });
    rerender(<NotificationBell onClick={vi.fn()} />);
    expect(screen.getByTestId("notification-bell-icon-wrap").className).toContain(
      "animate-notification-bell",
    );
  });
});
