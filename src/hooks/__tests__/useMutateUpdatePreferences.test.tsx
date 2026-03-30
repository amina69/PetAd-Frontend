import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act, waitFor } from "@testing-library/react";
import { getApiClient } from "../../lib/api-client";
import { useMutateUpdatePreferences } from "../useMutateUpdatePreferences";
import type { NotificationPreferences } from "../../types/notifications";

vi.mock("../../lib/api-client", () => ({
  getApiClient: vi.fn(),
}));

const mockApiClient = {
  patch: vi.fn(),
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

const initialPreferences: NotificationPreferences = {
  APPROVAL_REQUESTED: true,
  ESCROW_FUNDED: true,
  DISPUTE_RAISED: true,
  SETTLEMENT_COMPLETE: true,
  DOCUMENT_EXPIRING: true,
  CUSTODY_EXPIRING: true,
};

const updatedPreferences: NotificationPreferences = {
  ...initialPreferences,
  APPROVAL_REQUESTED: false,
};

describe("useMutateUpdatePreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApiClient).mockReturnValue(mockApiClient as never);
  });

  it("calls the API with the updated preferences payload", async () => {
    mockApiClient.patch.mockResolvedValue({});

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMutateUpdatePreferences(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(updatedPreferences);
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith(
      "/notifications/preferences",
      updatedPreferences
    );
  });

  it("optimistically updates and rolls back on error", async () => {
    let rejectPatch: ((reason?: unknown) => void) | undefined;
    mockApiClient.patch.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectPatch = reject;
        })
    );

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["notificationPreferences"], initialPreferences);

    const { result } = renderHook(() => useMutateUpdatePreferences(), { wrapper });

    act(() => {
      result.current.mutate(updatedPreferences);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(["notificationPreferences"])).toEqual(updatedPreferences);
    });

    act(() => {
      rejectPatch?.(new Error("network error"));
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(["notificationPreferences"])).toEqual(initialPreferences);
    });
  });
});
