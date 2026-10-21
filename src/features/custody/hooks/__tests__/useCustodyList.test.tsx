import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import { custodyKeys, useCustodyList } from "../useCustodyList";
import type { CustodyArrangement, CustodyStatus } from "../../types/custody";

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
  escrowStatus: "FUNDED",
  escrowId: "escrow-1",
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("useCustodyList", () => {
  it("keys the query by ['custody', params]", async () => {
    const { queryClient, wrapper } = createWrapper();

    server.use(
      http.get("*/api/custody", () =>
        HttpResponse.json({
          data: [ARRANGEMENT],
          total: 1,
          page: 1,
          limit: 20,
        }),
      ),
    );

    const params = { status: "active" as const };
    const { result } = renderHook(() => useCustodyList(params), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0]).toEqual(ARRANGEMENT);

    // The cache entry lives under the documented key.
    expect(
      queryClient.getQueryData(custodyKeys.list(params)),
    ).toEqual(result.current.data);
  });

  it("uses a different cache entry for each params combination", async () => {
    const { queryClient, wrapper } = createWrapper();

    server.use(
      http.get("*/api/custody", ({ request }) => {
        const status = new URL(request.url).searchParams.get("status");
        return HttpResponse.json({
          data: [{ ...ARRANGEMENT, status: status ?? "active" }],
          total: 1,
          page: 1,
          limit: 20,
        });
      }),
    );

    const { result, rerender } = renderHook(
      (params: { status?: CustodyStatus }) => useCustodyList(params),
      { wrapper, initialProps: { status: "active" as CustodyStatus } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data[0].status).toBe("active");

    rerender({ status: "requested" });
    await waitFor(() =>
      expect(result.current.data?.data[0].status).toBe("requested"),
    );

    // Two distinct cache entries — one per params object.
    expect(
      queryClient.getQueryCache().getAll().filter((query) =>
        query.queryKey[0] === "custody",
      ),
    ).toHaveLength(2);
  });

  it("surfaces API errors", async () => {
    server.use(
      http.get("*/api/custody", () =>
        HttpResponse.json({ message: "Boom" }, { status: 500 }),
      ),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCustodyList(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeUndefined();
  });
});
