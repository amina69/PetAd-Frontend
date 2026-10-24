import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PendingApprovalBadge } from "../PendingApprovalBadge";

const mockUsePendingApprovalsCount = vi.fn();
const mockUseRoleGuard = vi.fn();

vi.mock("../../../hooks/usePendingApprovalsCount", () => ({
  usePendingApprovalsCount: () => mockUsePendingApprovalsCount(),
}));

vi.mock("../../../hooks/useRoleGuard", () => ({
  useRoleGuard: () => mockUseRoleGuard(),
}));

describe("PendingApprovalBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoleGuard.mockReturnValue({
      role: "ADMIN",
      isAdmin: true,
      isShelter: false,
      isUser: false,
      canApprove: true,
      hasAccess: vi.fn().mockReturnValue(true),
    });
  });

  it("renders the exact count when it is below 10", () => {
    mockUsePendingApprovalsCount.mockReturnValue({
      count: 4,
      displayCount: "4",
      isLoading: false,
      isError: false,
    });

    render(<PendingApprovalBadge />);

    expect(screen.getByTestId("pending-approval-badge")).toHaveTextContent("4");
  });

  it('caps the visible label at "9+" above 9', () => {
    mockUsePendingApprovalsCount.mockReturnValue({
      count: 12,
      displayCount: "9+",
      isLoading: false,
      isError: false,
    });

    render(<PendingApprovalBadge />);

    expect(screen.getByTestId("pending-approval-badge")).toHaveTextContent("9+");
  });

  it("hides the badge for non-approval roles", () => {
    mockUseRoleGuard.mockReturnValue({
      role: "USER",
      isAdmin: false,
      isShelter: false,
      isUser: true,
      canApprove: false,
      hasAccess: vi.fn().mockReturnValue(false),
    });

    mockUsePendingApprovalsCount.mockReturnValue({
      count: 6,
      displayCount: "6",
      isLoading: false,
      isError: false,
    });

    const { container } = render(<PendingApprovalBadge />);

    expect(container.firstChild).toBeNull();
  });

  it("hides the badge when the count is zero", () => {
    mockUsePendingApprovalsCount.mockReturnValue({
      count: 0,
      displayCount: "0",
      isLoading: false,
      isError: false,
    });

    const { container } = render(<PendingApprovalBadge />);

    expect(container.firstChild).toBeNull();
  });
});
