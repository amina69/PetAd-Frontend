import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { SettlementFailureState } from "../SettlementFailureState";

vi.mock("../../../hooks/useRoleGuard", () => ({
  useRoleGuard: vi.fn(),
}));

vi.mock("../../../api/escrowService", () => ({
  escrowService: {
    retrySettlement: vi.fn(),
  },
}));

import { useRoleGuard } from "../../../hooks/useRoleGuard";
import { escrowService } from "../../../api/escrowService";

const mockUseRoleGuard = vi.mocked(useRoleGuard);
const mockRetrySettlement = vi.mocked(escrowService.retrySettlement);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const DEFAULT_PROPS = {
  failureReason: "Insufficient funds in escrow wallet.",
  escrowId: "escrow-123",
};

function renderComponent(props = DEFAULT_PROPS) {
  return render(<SettlementFailureState {...props} />, {
    wrapper: createWrapper(),
  });
}

describe("SettlementFailureState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRoleGuard.mockReturnValue({
      role: "user",
      isAdmin: false,
      isUser: true,
      hasAccess: vi.fn().mockReturnValue(false),
    });
    mockRetrySettlement.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the failure reason from the API", () => {
    renderComponent();
    const el = screen.getByTestId("failure-reason");
    expect(el).toBeTruthy();
    expect(el.textContent).toContain(DEFAULT_PROPS.failureReason);
  });

  it("renders the Settlement Failed heading", () => {
    renderComponent();
    expect(screen.getByText("Settlement Failed")).toBeTruthy();
  });

  it("hides the retry button for non-admin users", () => {
    mockUseRoleGuard.mockReturnValue({
      role: "user",
      isAdmin: false,
      isUser: true,
      hasAccess: vi.fn().mockReturnValue(false),
    });
    renderComponent();
    expect(screen.queryByTestId("retry-settlement-btn")).toBeNull();
  });

  it("shows the retry button for admin users", () => {
    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });
    renderComponent();
    expect(screen.getByTestId("retry-settlement-btn")).toBeTruthy();
  });

  it("shows the confirmation modal when admin clicks retry, before mutation fires", () => {
    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });

    renderComponent();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockRetrySettlement).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("retry-settlement-btn"));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(mockRetrySettlement).not.toHaveBeenCalled();
  });

  it("closes the confirmation modal when cancel is clicked without calling mutation", () => {
    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });

    renderComponent();

    fireEvent.click(screen.getByTestId("retry-settlement-btn"));
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockRetrySettlement).not.toHaveBeenCalled();
  });

  it("calls retrySettlement with the correct escrowId after confirming", async () => {
    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });

    renderComponent();

    fireEvent.click(screen.getByTestId("retry-settlement-btn"));
    fireEvent.click(screen.getByTestId("confirm-retry-btn"));

    await waitFor(() => {
      expect(mockRetrySettlement).toHaveBeenCalledWith(DEFAULT_PROPS.escrowId);
    });
  });

  it("shows a spinner on the confirm button while the retry is in progress", async () => {
    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });

    let resolveFn!: () => void;
    mockRetrySettlement.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveFn = resolve;
      }),
    );

    renderComponent();

    fireEvent.click(screen.getByTestId("retry-settlement-btn"));
    fireEvent.click(screen.getByTestId("confirm-retry-btn"));

    await waitFor(() => {
      const btn = screen.getByTestId("confirm-retry-btn");
      expect(btn.textContent).toMatch(/retrying/i);
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    await act(async () => {
      resolveFn();
    });
  });

  it("shows a success toast after a successful retry", async () => {
    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });
    mockRetrySettlement.mockResolvedValue(undefined);

    renderComponent();

    fireEvent.click(screen.getByTestId("retry-settlement-btn"));
    fireEvent.click(screen.getByTestId("confirm-retry-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("toast-success")).toBeTruthy();
    });

    expect(screen.getByTestId("toast-success").textContent).toMatch(
      /retry succeeded/i,
    );
  });

  it("shows an error toast when the retry fails", async () => {
    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });
    mockRetrySettlement.mockRejectedValue(
      new Error("Network error, please try again."),
    );

    renderComponent();

    fireEvent.click(screen.getByTestId("retry-settlement-btn"));
    fireEvent.click(screen.getByTestId("confirm-retry-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("toast-error")).toBeTruthy();
    });

    expect(screen.getByTestId("toast-error").textContent).toMatch(
      /retry failed|network error/i,
    );
  });

  it("calls the onRetry prop after a successful retry", async () => {
    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
      hasAccess: vi.fn().mockReturnValue(true),
    });
    mockRetrySettlement.mockResolvedValue(undefined);
    const onRetry = vi.fn();

    render(<SettlementFailureState {...DEFAULT_PROPS} onRetry={onRetry} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByTestId("retry-settlement-btn"));
    fireEvent.click(screen.getByTestId("confirm-retry-btn"));

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
