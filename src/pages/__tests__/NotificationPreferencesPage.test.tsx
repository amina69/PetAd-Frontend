import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NotificationPreferencesPage from "../NotificationPreferencesPage";
import type { NotificationPreferences } from "../../types/notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

const mockUseNotificationPreferences = vi.fn();
const mockUseMutateUpdatePreferences = vi.fn();

vi.mock("../../hooks/useNotificationPreferences", () => ({
  useNotificationPreferences: () => mockUseNotificationPreferences(),
}));

vi.mock("../../hooks/useMutateUpdatePreferences", () => ({
  useMutateUpdatePreferences: () => mockUseMutateUpdatePreferences(),
}));

const enabledPreferences: NotificationPreferences = {
  APPROVAL_REQUESTED: true,
  ESCROW_FUNDED: true,
  DISPUTE_RAISED: true,
  SETTLEMENT_COMPLETE: true,
  DOCUMENT_EXPIRING: true,
  CUSTODY_EXPIRING: true,
};

function renderPage() {
  return render(<NotificationPreferencesPage />, { wrapper });
}

describe("NotificationPreferencesPage", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockUseNotificationPreferences.mockReturnValue({
      data: enabledPreferences,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("debounces toggle saves and only patches once", () => {
    const mockMutate = vi.fn();
    mockUseMutateUpdatePreferences.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    renderPage();

    const approvalToggle = screen.getByText("Approval Requested");
    fireEvent.click(approvalToggle);
    fireEvent.click(approvalToggle);

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(mockMutate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      enabledPreferences,
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("requires reset confirmation before patching all-enabled preferences", () => {
    const mockMutate = vi.fn();
    mockUseNotificationPreferences.mockReturnValue({
      data: {
        ...enabledPreferences,
        APPROVAL_REQUESTED: false,
        ESCROW_FUNDED: false,
      },
      isLoading: false,
    });
    mockUseMutateUpdatePreferences.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    renderPage();

    fireEvent.click(screen.getByText("Reset to defaults"));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Reset"));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      enabledPreferences,
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("shows inline saved confirmation for two seconds after a successful save", () => {
    const mockMutate = vi.fn((_preferences, options) => {
      options?.onSuccess?.();
    });
    mockUseMutateUpdatePreferences.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    renderPage();

    fireEvent.click(screen.getByText("Approval Requested"));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("Saved")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });
});
