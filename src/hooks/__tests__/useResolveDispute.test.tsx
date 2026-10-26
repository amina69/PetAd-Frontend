import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { useResolveDispute } from "../useResolveDispute";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useResolveDispute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /api/disputes/:id/resolve with correct payload", async () => {
    let capturedUrl = "";
    let capturedBody: any = null;

    server.use(
      http.post("/api/disputes/:id/resolve", async ({ request, params }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json({
          id: params.id,
          status: "resolved",
          resolution: "Refund",
        });
      }),
    );

    const { result } = renderHook(() => useResolveDispute(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        disputeId: "dispute-001",
        shelterPercent: 60,
        adopterPercent: 40,
      });
    });

    expect(capturedUrl).toContain("/api/disputes/dispute-001/resolve");
    expect(capturedBody).toEqual({ shelterPercent: 60, adopterPercent: 40 });
    expect(result.current.isError).toBe(false);
  });

  it("sets isError to true on server error", async () => {
    server.use(
      http.post("/api/disputes/:id/resolve", () => {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      }),
    );

    const { result } = renderHook(() => useResolveDispute(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          disputeId: "not-found",
          shelterPercent: 100,
          adopterPercent: 0,
        });
      } catch {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("returns resolved data on success", async () => {
    server.use(
      http.post("/api/disputes/:id/resolve", () => {
        return HttpResponse.json({
          id: "dispute-001",
          status: "resolved",
          resolution: "Split 60/40",
        });
      }),
    );

    const { result } = renderHook(() => useResolveDispute(), {
      wrapper: createWrapper(),
    });

    let responseData: any;
    await act(async () => {
      responseData = await result.current.mutateAsync({
        disputeId: "dispute-001",
        shelterPercent: 60,
        adopterPercent: 40,
      });
    });

    expect(responseData.status).toBe("resolved");
    expect(responseData.resolution).toBe("Split 60/40");
  });
});
