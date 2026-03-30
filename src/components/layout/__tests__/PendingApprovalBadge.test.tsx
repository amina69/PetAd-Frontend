import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PendingApprovalBadge } from "../PendingApprovalBadge";

// Mock the hooks
vi.mock("../../../hooks/usePendingApprovals", () => ({
  usePendingApprovals: vi.fn(),
}));

vi.mock("../../../hooks/useRoleGuard", () => ({
  useRoleGuard: vi.fn(),
}));

import { usePendingApprovals } from "../../../hooks/usePendingApprovals";
import { useRoleGuard } from "../../../hooks/useRoleGuard";

describe("PendingApprovalBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render null when count is 0", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    const { container } = render(<PendingApprovalBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("should render null when user is not SHELTER or ADMIN", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 5 });
    (useRoleGuard as any).mockReturnValue({ role: "user" });

    const { container } = render(<PendingApprovalBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("should render badge with count for ADMIN role with pending approvals", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 3 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    render(<PendingApprovalBadge />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should render badge with count for SHELTER role with pending approvals", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 5 });
    (useRoleGuard as any).mockReturnValue({ role: "shelter" });

    render(<PendingApprovalBadge />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should display '9+' for counts above 9", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 15 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    render(<PendingApprovalBadge />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("should display '9' for exactly 9 items", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 9 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    render(<PendingApprovalBadge />);
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("should have correct styling (red background, white text)", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 3 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    render(<PendingApprovalBadge />);
    const badge = screen.getByText("3");
    expect(badge).toHaveClass("bg-red-500", "text-white", "rounded-full");
  });

  it("should render null when count is 0 even for ADMIN", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    const { container } = render(<PendingApprovalBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("should update when pending count changes", () => {
    const { rerender } = render(<PendingApprovalBadge />);

    (usePendingApprovals as any).mockReturnValue({ pendingCount: 2 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    rerender(<PendingApprovalBadge />);
    expect(screen.getByText("2")).toBeInTheDocument();

    (usePendingApprovals as any).mockReturnValue({ pendingCount: 10 });
    rerender(<PendingApprovalBadge />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });
});
