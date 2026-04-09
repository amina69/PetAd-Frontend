import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApprovalsPage } from "../ApprovalsPage";
import { BrowserRouter } from "react-router-dom";

// Mock hooks and components
vi.mock("../../components/layout/MainLayout", () => ({
  MainLayout: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("../../hooks/useRoleGuard", () => ({
  useRoleGuard: vi.fn(),
}));

vi.mock("../../hooks/usePendingApprovals", () => ({
  usePendingApprovals: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useRoleGuard } from "../../hooks/useRoleGuard";
import { usePendingApprovals } from "../../hooks/usePendingApprovals";
import { useNavigate } from "react-router-dom";

const renderApprovalsPage = () => {
  return render(
    <BrowserRouter>
      <ApprovalsPage />
    </BrowserRouter>,
  );
};

describe("ApprovalsPage", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it("should redirect non-authorized users to home", () => {
    (useRoleGuard as any).mockReturnValue({ role: "user", isLoading: false });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: undefined,
      isLoading: false,
      isError: false,
      isForbidden: false,
      pendingCount: 0,
    });

    renderApprovalsPage();

    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  it("should render page for ADMIN users with pending approvals", () => {
    (useRoleGuard as any).mockReturnValue({ role: "admin", isLoading: false });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: {
        data: [
          {
            id: "1",
            status: "PENDING",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
        total: 1,
        limit: 0,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      isForbidden: false,
      pendingCount: 1,
    });

    renderApprovalsPage();

    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(
      screen.getByText("Manage and review pending adoption approvals"),
    ).toBeInTheDocument();
  });

  it("should render page for SHELTER users", () => {
    (useRoleGuard as any).mockReturnValue({
      role: "shelter",
      isLoading: false,
    });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: undefined,
      isLoading: false,
      isError: false,
      isForbidden: false,
      pendingCount: 0,
    });

    renderApprovalsPage();

    expect(screen.getByText("Approvals")).toBeInTheDocument();
  });

  it("should show error message on API error", () => {
    (useRoleGuard as any).mockReturnValue({ role: "admin", isLoading: false });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: undefined,
      isLoading: false,
      isError: true,
      isForbidden: false,
      pendingCount: 0,
    });

    renderApprovalsPage();

    expect(screen.getByText("Error Loading Approvals")).toBeInTheDocument();
    expect(
      screen.getByText("Failed to load approvals. Please try again later."),
    ).toBeInTheDocument();
  });

  it("should show access denied message on forbidden error", () => {
    (useRoleGuard as any).mockReturnValue({ role: "admin", isLoading: false });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: undefined,
      isLoading: false,
      isError: false,
      isForbidden: true,
      pendingCount: 0,
    });

    renderApprovalsPage();

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You do not have permission to view this page."),
    ).toBeInTheDocument();
  });

  it("should show loading spinner when data is loading", () => {
    (useRoleGuard as any).mockReturnValue({ role: "admin", isLoading: false });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: undefined,
      isLoading: true,
      isError: false,
      isForbidden: false,
      pendingCount: 0,
    });

    renderApprovalsPage();

    expect(screen.getByText("Approvals")).toBeInTheDocument();
  });

  it("should show empty state when no approvals", () => {
    (useRoleGuard as any).mockReturnValue({ role: "admin", isLoading: false });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: { data: [], total: 0, limit: 0, offset: 0 },
      isLoading: false,
      isError: false,
      isForbidden: false,
      pendingCount: 0,
    });

    renderApprovalsPage();

    expect(screen.getByText("All caught up!")).toBeInTheDocument();
  });

  it("should display pending count banner when approvals exist", () => {
    (useRoleGuard as any).mockReturnValue({ role: "admin", isLoading: false });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: {
        data: [
          {
            id: "1",
            status: "PENDING",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
          {
            id: "2",
            status: "PENDING",
            createdAt: "2026-01-02",
            updatedAt: "2026-01-02",
          },
        ],
        total: 2,
        limit: 0,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      isForbidden: false,
      pendingCount: 2,
    });

    renderApprovalsPage();

    expect(screen.getByText("2 pending approvals")).toBeInTheDocument();
  });

  it("should display approval items correctly", () => {
    (useRoleGuard as any).mockReturnValue({ role: "admin", isLoading: false });
    (usePendingApprovals as any).mockReturnValue({
      approvalsData: {
        data: [
          {
            id: "approval-123",
            status: "PENDING",
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
          },
        ],
        total: 1,
        limit: 0,
        offset: 0,
      },
      isLoading: false,
      isError: false,
      isForbidden: false,
      pendingCount: 1,
    });

    renderApprovalsPage();

    expect(screen.getByText("Approval ID: approval-123")).toBeInTheDocument();
  });
});
