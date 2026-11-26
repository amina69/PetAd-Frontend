import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { useRejectRequest } from "../useRejectRequest";
import { approvalKeys } from "../useApprovalList";

vi.mock("../../api/approvalService", () => ({
  approvalService: {
    rejectRequest: vi.fn(),
  },
}));

import { approvalService } from "../../api/approvalService";

const mockedReject = approvalService.rejectRequest as ReturnType<typeof vi.fn>;

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

describe("useRejectRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validReason =
    "The applicant did not provide the required vaccination records in time.";

  it("calls approvalService.rejectRequest with the id and reason", async () => {
    mockedReject.mockResolvedValue({
      id: "app-1",
      status: "REJECTED",
    } as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRejectRequest(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "app-1", reason: validReason });
    });

    expect(mockedReject).toHaveBeenCalledWith("app-1", { reason: validReason });
    expect(result.current.isError).toBe(false);
  });

  it("blocks a short reason before any network call", async () => {
    mockedReject.mockRejectedValue(
      new Error("Please provide at least 20 characters explaining the rejection"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRejectRequest(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: "app-1", reason: "too short" });
      }),
    ).rejects.toThrow(
      "Please provide at least 20 characters explaining the rejection",
    );

    expect(mockedReject).toHaveBeenCalledWith("app-1", {
      reason: "too short",
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("invalidates the approvals list cache on success", async () => {
    mockedReject.mockResolvedValue({
      id: "app-1",
      status: "REJECTED",
    } as any);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRejectRequest(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "app-1", reason: validReason });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: approvalKeys.all,
    });
  });

  it("propagates errors from the service layer", async () => {
    const error = new Error("Request already decided");
    mockedReject.mockRejectedValue(error);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRejectRequest(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: "app-1", reason: validReason });
      }),
    ).rejects.toThrow("Request already decided");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });
});
