import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "../Navbar";
import { BrowserRouter } from "react-router-dom";

// Mock the hooks
vi.mock("../../../hooks/usePendingApprovals", () => ({
  usePendingApprovals: vi.fn(),
}));

vi.mock("../../../hooks/useRoleGuard", () => ({
  useRoleGuard: vi.fn(),
}));

import { usePendingApprovals } from "../../../hooks/usePendingApprovals";
import { useRoleGuard } from "../../../hooks/useRoleGuard";

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>,
  );
};

describe("Navbar with PendingApprovalBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not show Approvals link for non-authorized users", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "user" });

    renderNavbar();

    expect(screen.queryByText("Approvals")).not.toBeInTheDocument();
  });

  it("should show Approvals link for ADMIN users", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    renderNavbar();

    expect(screen.getByText("Approvals")).toBeInTheDocument();
  });

  it("should show Approvals link for SHELTER users", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "shelter" });

    renderNavbar();

    expect(screen.getByText("Approvals")).toBeInTheDocument();
  });

  it("should display badge with count on Approvals link for ADMIN", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 3 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    renderNavbar();

    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("should display '9+' badge for high pending counts", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 25 });
    (useRoleGuard as any).mockReturnValue({ role: "shelter" });

    renderNavbar();

    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("should not show badge when count is 0", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    renderNavbar();

    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("should show Home link for all users", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "user" });

    renderNavbar();

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("should show Listings link for all users", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "user" });

    renderNavbar();

    expect(screen.getByText("Listings")).toBeInTheDocument();
  });

  it("should link Approvals to correct path", () => {
    (usePendingApprovals as any).mockReturnValue({ pendingCount: 0 });
    (useRoleGuard as any).mockReturnValue({ role: "admin" });

    renderNavbar();

    const approvalsLink = screen.getByText("Approvals").closest("a");
    expect(approvalsLink).toHaveAttribute("href", "/approvals");
  });
});
