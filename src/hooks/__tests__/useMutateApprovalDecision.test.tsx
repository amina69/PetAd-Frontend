import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { useMutateApprovalDecision } from "../useMutateApprovalDecision";
import { adoptionService } from "../../api/adoptionService";
import type { ApprovalItem } from "../../types/adoption";
import { ApiError } from "../../lib/api-errors";

// Mock the adoption service
vi.mock("../../api/adoptionService", () => ({
  adoptionService: {
    approveAdoption: vi.fn(),
  },
}));

/** Create a fresh QueryClient + wrapper for each test */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe("useMutateApprovalDecision", () => {
  const adoptionId = "test-adoption-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls approveAdoption and invalidates queries on success", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    
    vi.mocked(adoptionService.approveAdoption).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMutateApprovalDecision(adoptionId), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ decision: "approve", reason: "All good" });
    });

    expect(adoptionService.approveAdoption).toHaveBeenCalledWith(adoptionId, {
      decision: "approve",
      reason: "All good",
    });

    // Verify invalidations
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["adoption", adoptionId] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["approvals", adoptionId] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["escrow-timeline", adoptionId] });
  });

  it("optimistically updates the approvals list", async () => {
    const { queryClient, wrapper } = createWrapper();
    const queryKey = ["approvals", adoptionId];

    // Seed initial data
    const initialApprovals: ApprovalItem[] = [
      {
        id: "1",
        adoptionId,
        reviewer: { id: "rev-1", name: "Reviewer 1", role: "vet" },
        decision: "pending",
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        resolvedAt: null,
      },
    ];
    queryClient.setQueryData(queryKey, initialApprovals);

    vi.mocked(adoptionService.approveAdoption).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useMutateApprovalDecision(adoptionId), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ decision: "approve", reason: "Approved!" });
    });

    // Use waitFor to wait for the optimistic update to be applied to the cache
    await waitFor(() => {
      const optimisticData = queryClient.getQueryData<ApprovalItem[]>(queryKey);
      expect(optimisticData?.[0].decision).toBe("approve");
      expect(optimisticData?.[0].notes).toBe("Approved!");
      expect(optimisticData?.[0].resolvedAt).not.toBeNull();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("rolls back optimistic update on error", async () => {
    const { queryClient, wrapper } = createWrapper();
    const queryKey = ["approvals", adoptionId];

    const initialApprovals: ApprovalItem[] = [
      {
        id: "1",
        adoptionId,
        reviewer: { id: "rev-1", name: "Reviewer 1", role: "vet" },
        decision: "pending",
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        resolvedAt: null,
      },
    ];
    queryClient.setQueryData(queryKey, initialApprovals);

    const apiError = new ApiError("Failed", { status: 500 });
    vi.mocked(adoptionService.approveAdoption).mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(apiError), 50))
    );

    const { result } = renderHook(() => useMutateApprovalDecision(adoptionId), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ decision: "reject", reason: "Rejected!" });
    });

    // Verify optimistic state is briefly applied
    await waitFor(() => {
      expect(queryClient.getQueryData<ApprovalItem[]>(queryKey)?.[0].decision).toBe("reject");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify rollback
    expect(queryClient.getQueryData<ApprovalItem[]>(queryKey)).toEqual(initialApprovals);
    expect(queryClient.getQueryData<ApprovalItem[]>(queryKey)?.[0].decision).toBe("pending");
  });
});
