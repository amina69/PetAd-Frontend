import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useMutateApprovalDecision } from "../useMutateApprovalDecision";
import { server } from "../../mocks/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import type { ApprovalDecision } from "../../types/adoption";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const MOCK_APPROVALS: ApprovalDecision[] = [
  {
    id: "dec-1",
    approverName: "Happy Paws Shelter",
    approverRole: "Shelter",
    status: "APPROVED",
    timestamp: "2026-03-25T10:00:00Z",
  }
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useMutateApprovalDecision", () => {
  const adoptionId = "adoption-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies optimistic update before server responds", async () => {
    let resolveRequest!: () => void;
    const requestInflight = new Promise<void>((res) => {
      resolveRequest = res;
    });

    server.use(
      http.post(`*/api/adoption/${adoptionId}/approve`, async () => {
        await requestInflight;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["adoption", adoptionId, "approvals"], MOCK_APPROVALS);

    const { result } = renderHook(
      () => useMutateApprovalDecision(adoptionId),
      { wrapper }
    );

    act(() => {
      result.current.mutate({
        decision: "APPROVED",
        reason: "Looks good!",
        role: "Admin"
      });
    });

    // Check optimistic update
    await waitFor(() => {
      const cache = queryClient.getQueryData<ApprovalDecision[]>(["adoption", adoptionId, "approvals"]);
      expect(cache).toHaveLength(2);
      expect(cache?.find(d => d.approverRole === "Admin")).toBeDefined();
      expect(cache?.find(d => d.approverRole === "Admin")?.status).toBe("APPROVED");
    });

    resolveRequest();
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("rolls back on error", async () => {
    server.use(
      http.post(`*/api/adoption/${adoptionId}/approve`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["adoption", adoptionId, "approvals"], MOCK_APPROVALS);

    const { result } = renderHook(
      () => useMutateApprovalDecision(adoptionId),
      { wrapper }
    );

    act(() => {
      result.current.mutate({
        decision: "APPROVED",
        reason: "Looks good!",
        role: "Admin"
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cache should be rolled back to original MOCK_APPROVALS
    const cache = queryClient.getQueryData<ApprovalDecision[]>(["adoption", adoptionId, "approvals"]);
    expect(cache).toHaveLength(1);
    expect(cache?.[0].approverRole).toBe("Shelter");
  });

  it("invalidates correct query keys on success", async () => {
    server.use(
      http.post(`*/api/adoption/${adoptionId}/approve`, () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useMutateApprovalDecision(adoptionId),
      { wrapper }
    );

    act(() => {
      result.current.mutate({
        decision: "APPROVED",
        reason: "Looks good!",
        role: "Admin"
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["adoption", adoptionId] }));
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["adoption", adoptionId, "approvals"] }));
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["adoption", adoptionId, "timeline"] }));
  });
});
