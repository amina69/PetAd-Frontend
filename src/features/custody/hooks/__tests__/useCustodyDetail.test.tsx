import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import { custodyKeys } from "../useCustodyList";
import { useCustodyDetail } from "../useCustodyDetail";
import type { CustodyArrangement } from "../../types/custody";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const ARRANGEMENT: CustodyArrangement = {
  id: "custody-1",
  petId: "pet-1",
  ownerId: "user-1",
  caretakerId: "user-2",
  startDate: "2026-06-20",
  endDate: "2026-06-27",
  status: "active",
  notes: null,
  // The arrangement claims the escrow is FUNDED…
  escrowStatus: "FUNDED",
  escrowId: "escrow-1",
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("useCustodyDetail", () => {
  it("reads the escrow from the escrow endpoint instead of deriving it client-side", async () => {
    const escrowRequestUrls: string[] = [];

    server.use(
      http.get("*/api/custody/:id", () => HttpResponse.json(ARRANGEMENT)),
      http.get("*/api/escrow/:id/status", ({ request }) => {
        escrowRequestUrls.push(request.url);
        // The escrow endpoint reports a *different* state than the
        // arrangement — the hook must surface the server value.
        return HttpResponse.json({
          id: "escrow-1",
          status: "RELEASED",
          balance: "0",
          signatures: [],
          required_approvals: 2,
          escrow_account_id: "GESCROW",
        });
      }),
    );

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useCustodyDetail("custody-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data?.id).toBe("custody-1");
    expect(escrowRequestUrls).toHaveLength(1);
    expect(escrowRequestUrls[0]).toContain("/api/escrow/escrow-1/status");

    // Server-sourced escrow state — not the arrangement's own `escrowStatus`.
    expect(result.current.data?.escrow?.status).toBe("RELEASED");
    expect(result.current.data?.escrowStatus).toBe("FUNDED");

    // Cached under the detail key.
    expect(queryClient.getQueryData(custodyKeys.detail("custody-1"))).toEqual(
      result.current.data,
    );
  });

  it("falls back to the arrangement id when the API does not expose an escrow id", async () => {
    const escrowRequestUrls: string[] = [];

    server.use(
      http.get("*/api/custody/:id", () =>
        HttpResponse.json({ ...ARRANGEMENT, escrowId: undefined }),
      ),
      http.get("*/api/escrow/:id/status", ({ request }) => {
        escrowRequestUrls.push(request.url);
        return HttpResponse.json({ id: "escrow-1", status: "FUNDED" });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCustodyDetail("custody-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(escrowRequestUrls[0]).toContain("/api/escrow/custody-1/status");
    expect(result.current.data?.escrow?.status).toBe("FUNDED");
  });

  it("reports a null escrow when the arrangement has no escrow record", async () => {
    server.use(
      http.get("*/api/custody/:id", () =>
        HttpResponse.json({
          ...ARRANGEMENT,
          escrowStatus: null,
          escrowId: null,
        }),
      ),
      http.get("*/api/escrow/:id/status", () =>
        HttpResponse.json({ message: "not found" }, { status: 404 }),
      ),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCustodyDetail("custody-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // The custody data is still returned even though the escrow lookup failed.
    expect(result.current.isError).toBe(false);
    expect(result.current.data?.id).toBe("custody-1");
    expect(result.current.data?.escrow).toBeNull();
  });

  it("does not request anything without a custody id", async () => {
    let custodyCalls = 0;
    let escrowCalls = 0;

    server.use(
      http.get("*/api/custody/:id", () => {
        custodyCalls += 1;
        return HttpResponse.json(ARRANGEMENT);
      }),
      http.get("*/api/escrow/:id/status", () => {
        escrowCalls += 1;
        return HttpResponse.json({ id: "escrow-1", status: "FUNDED" });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCustodyDetail(undefined), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(custodyCalls).toBe(0);
    expect(escrowCalls).toBe(0);
    expect(result.current.data).toBeUndefined();
  });
});
