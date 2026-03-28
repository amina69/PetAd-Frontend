import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useSettlementSummary } from "../useSettlementSummary";
import { server } from "../../mocks/server";
import { describe, it, expect } from "vitest";
import React from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useSettlementSummary", () => {
  it("data returned: resolves settlement summary from the MSW handler", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSettlementSummary("escrow-001"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.isNotFound).toBe(false);
    expect(result.current.data).toMatchObject({
      onChainStatus: "SUCCESS",
      confirmations: 12,
      payments: expect.arrayContaining([
        expect.objectContaining({ id: "pay-1", asset: "XLM", status: "SUCCESS" }),
      ]),
      stellarExplorerUrl: expect.stringContaining("stellar.expert"),
    });
  });

  it("404 returns isNotFound: true when escrow id is 'not-found'", async () => {
    // The default escrow handler returns 404 for id === "not-found".
    // Override here to ensure this test is explicit and self-documenting.
    server.use(
      http.get("/api/escrow/:id/settlement-summary", ({ params }) => {
        if (params.id === "not-found") {
          return new HttpResponse(null, { status: 404 });
        }
        return HttpResponse.json({});
      }),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSettlementSummary("not-found"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.isNotFound).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
