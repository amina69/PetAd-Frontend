import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useRetrySettlement } from "../useRetrySettlement";
import { server } from "../../mocks/server";
import { describe, it, expect, vi } from "vitest";
import React from "react";

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useRetrySettlement", () => {
  it("calls correct endpoint: POST /api/escrow/:id/retry-settlement on success", async () => {
    let requestedUrl: string | undefined;

    server.use(
      http.post("/api/escrow/:id/retry-settlement", ({ request }) => {
        requestedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetrySettlement("escrow-001"), {
      wrapper,
    });

    act(() => {
      result.current.mutateRetrySettlement();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(requestedUrl).toContain("/api/escrow/escrow-001/retry-settlement");
  });

  it("invalidates escrow query on success", async () => {
    const { queryClient, wrapper } = createWrapper();
    // Seed a query to watch for invalidation
    queryClient.setQueryData(["escrow", "escrow-001"], { status: "FUNDED" });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRetrySettlement("escrow-001"), {
      wrapper,
    });

    await act(async () => {
      result.current.mutateRetrySettlement();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["escrow", "escrow-001"] }),
    );
  });

  it("returns isError true when server responds with 500", async () => {
    // The default MSW handler returns 500 for id === "fail"
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRetrySettlement("fail"), {
      wrapper,
    });

    act(() => {
      result.current.mutateRetrySettlement();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(true);
  });
});
