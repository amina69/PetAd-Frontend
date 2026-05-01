import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "../Navbar";
import { useRoleGuard } from "../../../hooks/useRoleGuard";
import { usePendingApprovalsCount } from "../../../hooks/usePendingApprovalsCount";
import type { ReactNode } from "react";

vi.mock("../../../hooks/useRoleGuard");
vi.mock("../../../hooks/usePendingApprovalsCount");

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

describe("Navbar - Approvals Badge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not show Approvals link for regular users", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "user",
      isAdmin: false,
      isShelter: false,
      isUser: true,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 5,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    expect(screen.queryByText("Approvals")).not.toBeInTheDocument();
  });

  it("should show Approvals link for admin users", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isShelter: false,
      isUser: false,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 0,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    expect(screen.getByText("Approvals")).toBeInTheDocument();
  });

  it("should show Approvals link for shelter users", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "shelter",
      isAdmin: false,
      isShelter: true,
      isUser: false,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 0,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    expect(screen.getByText("Approvals")).toBeInTheDocument();
  });

  it("should hide badge when count is 0", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isShelter: false,
      isUser: false,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 0,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    const badge = screen.queryByLabelText(/pending approval/i);
    expect(badge).not.toBeInTheDocument();
  });

  it("should display exact count when count is between 1 and 9", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isShelter: false,
      isUser: false,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 5,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    const badge = screen.getByLabelText("5 pending approvals");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("5");
  });

  it("should display '9+' when count is 10", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isShelter: false,
      isUser: false,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 10,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    const badge = screen.getByLabelText("10 pending approvals");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("9+");
  });

  it("should display '9+' when count is 100", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isShelter: false,
      isUser: false,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 100,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    const badge = screen.getByLabelText("100 pending approvals");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("9+");
  });

  it("should display singular 'approval' in aria-label when count is 1", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isShelter: false,
      isUser: false,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 1,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    const badge = screen.getByLabelText("1 pending approval");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("1");
  });

  it("should have correct styling for badge", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "admin",
      isAdmin: true,
      isShelter: false,
      isUser: false,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 3,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    const badge = screen.getByLabelText("3 pending approvals");
    expect(badge).toHaveClass("bg-red-500");
    expect(badge).toHaveClass("text-white");
    expect(badge).toHaveClass("rounded-full");
  });

  it("should show all base navigation links", () => {
    vi.mocked(useRoleGuard).mockReturnValue({
      role: "user",
      isAdmin: false,
      isShelter: false,
      isUser: true,
    });

    vi.mocked(usePendingApprovalsCount).mockReturnValue({
      count: 0,
      isLoading: false,
      isError: false,
    });

    render(<Navbar />, { wrapper: createWrapper() });

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Interests")).toBeInTheDocument();
    expect(screen.getByText("Listings")).toBeInTheDocument();
  });
});
