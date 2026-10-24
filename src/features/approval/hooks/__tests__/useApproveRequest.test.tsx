import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { useApproveRequest } from "../useApproveRequest";
import { approvalKeys } from "../useApprovalList";

vi.mock("../../api/approvalService", () => ({
  approvalService: {
    approveRequest: vi.fn(),
  },
}));

import { approvalService } from "../../api/approvalService";

const mockedApprove = approvalService.approveRequest as ReturnType<typeof vi.fn>;

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

describe("useApproveRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls approvalService.approveRequest with the request id", async () => {
    mockedApprove.mockResolvedValue({
      id: "app-1",
      status: "APPROVED",
    } as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApproveRequest(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("app-1");
    });

    expect(mockedApprove).toHaveBeenCalledWith("app-1");
    expect(result.current.isError).toBe(false);
  });

  it("invalidates the approvals list cache on success", async () => {
    mockedApprove.mockResolvedValue({
      id: "app-1",
      status: "APPROVED",
    } as any);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useApproveRequest(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("app-1");
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: approvalKeys.all,
    });
  });

  it("propagates errors from the service layer", async () => {
    const error = new Error("Request already decided");
    mockedApprove.mockRejectedValue(error);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApproveRequest(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync("app-1");
      }),
    ).rejects.toThrow("Request already decided");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });

  it("returns isPending while the mutation is in flight", async () => {
    let resolvePromise: (value: any) => void = () => {};
    mockedApprove.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useApproveRequest(), { wrapper });

    const promise = result.current.mutateAsync("app-1");

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      resolvePromise({ id: "app-1", status: "APPROVED" } as any);
      await promise;
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
