import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ApprovalBanner from "../ApprovalBanner";
import { usePendingApprovalsCount } from "../../../hooks/usePendingApprovalsCount";
import * as bannerSession from "../../../lib/approvalBannerSession";
import type { ReactNode } from "react";

vi.mock("../../../hooks/usePendingApprovalsCount");
vi.mock("../../../lib/approvalBannerSession");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  return Wrapper;
};

describe("ApprovalBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(bannerSession.shouldShowBanner).mockReturnValue(true);
  });

  it("should not render for unauthorized users", () => {
    localStorage.setItem("petad_user_role", "user");

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 5,
      isLoading: false,
      isError: false,
    });

    render(<ApprovalBanner />, { wrapper: createWrapper() });

    expect(screen.queryByText(/awaiting your approval/i)).not.toBeInTheDocument();
  });

  it("should render for admin users with pending approvals", () => {
    localStorage.setItem("petad_user_role", "admin");

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 3,
      isLoading: false,
      isError: false,
    });

    render(<ApprovalBanner />, { wrapper: createWrapper() });

    expect(screen.getByText(/3 adoption\(s\) awaiting your approval/i)).toBeInTheDocument();
  });

  it("should render for shelter users with pending approvals", () => {
    localStorage.setItem("petad_user_role", "shelter");

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 2,
      isLoading: false,
      isError: false,
    });

    render(<ApprovalBanner />, { wrapper: createWrapper() });

    expect(screen.getByText(/2 adoption\(s\) awaiting your approval/i)).toBeInTheDocument();
  });

  it("should not render when count is 0", () => {
    localStorage.setItem("petad_user_role", "admin");

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 0,
      isLoading: false,
      isError: false,
    });

    render(<ApprovalBanner />, { wrapper: createWrapper() });

    expect(screen.queryByText(/awaiting your approval/i)).not.toBeInTheDocument();
  });

  it("should not render while loading", () => {
    localStorage.setItem("petad_user_role", "admin");

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 5,
      isLoading: true,
      isError: false,
    });

    render(<ApprovalBanner />, { wrapper: createWrapper() });

    expect(screen.queryByText(/awaiting your approval/i)).not.toBeInTheDocument();
  });

  it("should dismiss banner when close button is clicked", () => {
    localStorage.setItem("petad_user_role", "admin");

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 3,
      isLoading: false,
      isError: false,
    });

    render(<ApprovalBanner />, { wrapper: createWrapper() });

    const closeButton = screen.getByRole("button", { name: /✕/i });
    fireEvent.click(closeButton);

    expect(bannerSession.setBannerDismissed).toHaveBeenCalledWith(3);
    expect(screen.queryByText(/awaiting your approval/i)).not.toBeInTheDocument();
  });

  it("should include link to approvals page", () => {
    localStorage.setItem("petad_user_role", "admin");

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 5,
      isLoading: false,
      isError: false,
    });

    render(<ApprovalBanner />, { wrapper: createWrapper() });

    const link = screen.getByRole("link", { name: /view/i });
    expect(link).toHaveAttribute("href", "/shelter/approvals");
  });

  it("should not render when shouldShowBanner returns false", () => {
    localStorage.setItem("petad_user_role", "admin");
    vi.mocked(bannerSession.shouldShowBanner).mockReturnValue(false);

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 5,
      isLoading: false,
      isError: false,
    });

    render(<ApprovalBanner />, { wrapper: createWrapper() });

    expect(screen.queryByText(/awaiting your approval/i)).not.toBeInTheDocument();
  });
});
