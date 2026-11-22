import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { delay, http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";
import React from "react";
import { useApprovalDetail } from "../useApprovalDetail";
import { approvalKeys, useApprovalList } from "../useApprovalList";
import { server } from "../../../../mocks/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DETAIL_URL = "http://localhost:3000/api/approvals/:id";

const detailPayload = {
  id: "app-1",
  approverName: "Dr. Sarah Lee",
  approverRole: "Veterinary Inspector",
  status: "APPROVED",
  timestamp: "2026-06-10T09:00:00.000Z",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

/**
 * Counts detail requests so tests can assert exactly how many were issued.
 * @param delayMs - Optional artificial latency, to observe in-flight states.
 */
function mockDetailEndpoint(delayMs = 0) {
  const calls: string[] = [];

  server.use(
    http.get(DETAIL_URL, async ({ params }) => {
      calls.push(String(params.id));
      if (delayMs > 0) {
        await delay(delayMs);
      }
      return HttpResponse.json({ ...detailPayload, id: String(params.id) });
    }),
  );

  return calls;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("useApprovalDetail", () => {
  it("does not issue a request while the id is missing (enabled: !!id)", async () => {
    const detailCalls = mockDetailEndpoint();

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApprovalDetail(), { wrapper });

    // A disabled query never enters a loading state — it stays idle.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();

    // Give the query every chance to fire a network request.
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(detailCalls).toHaveLength(0);
    expect(result.current.isError).toBe(false);
  });

  it("opens a detail view for an id already in the list cache without a loading state", async () => {
    const detailCalls = mockDetailEndpoint();

    const { wrapper } = createWrapper();

    // 1. The operator loads the list — `app-1` lands in the query cache.
    const list = renderHook(() => useApprovalList({ page: 1, limit: 10 }), {
      wrapper,
    });
    await waitFor(() => expect(list.result.current.isLoading).toBe(false));
    expect(
      list.result.current.data?.items.some((item) => item.id === "app-1"),
    ).toBe(true);
    list.unmount(); // cache survives; only the observer goes away

    // 2. Opening the detail view must not flash a loading state.
    const detail = renderHook(() => useApprovalDetail("app-1"), { wrapper });

    expect(detail.result.current.isLoading).toBe(false);
    expect(detail.result.current.isError).toBe(false);
    expect(detail.result.current.data?.id).toBe("app-1");
    expect(detail.result.current.data?.petName).toBe("Buddy");

    // 3. The authoritative payload is revalidated in the background.
    await waitFor(() => expect(detailCalls).toEqual(["app-1"]));
    await waitFor(() =>
      expect(detail.result.current.data?.approverName).toBe("Dr. Sarah Lee"),
    );
    expect(detail.result.current.isLoading).toBe(false);
    expect(detail.result.current.isError).toBe(false);
  });

  it("seeds initialData from any cached list page containing the id", async () => {
    const detailCalls = mockDetailEndpoint();

    const { queryClient, wrapper } = createWrapper();

    // Two list pages are cached; the requested id only exists on page 2.
    queryClient.setQueryData(approvalKeys.list({ page: 1, limit: 10 }), {
      items: [{ id: "app-1", petName: "Buddy", status: "PENDING" }],
      total: 40,
      page: 1,
      limit: 10,
    });
    queryClient.setQueryData(approvalKeys.list({ page: 2, limit: 10 }), {
      items: [{ id: "app-42", petName: "Bella", applicantName: "Emily White" }],
      total: 40,
      page: 2,
      limit: 10,
    });

    const { result } = renderHook(() => useApprovalDetail("app-42"), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data?.id).toBe("app-42");
    expect(result.current.data?.petName).toBe("Bella");

    await waitFor(() => expect(detailCalls).toEqual(["app-42"]));
  });

  it("shows a loading state when the id is in no cached list page", async () => {
    const detailCalls = mockDetailEndpoint(100);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApprovalDetail("app-99"), {
      wrapper,
    });

    // Nothing cached → the spinner shows while the request is in flight.
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data?.id).toBe("app-99");
    expect(detailCalls).toEqual(["app-99"]);
  });

  it("leaves the list cache untouched when opening a detail view", async () => {
    mockDetailEndpoint();

    const { queryClient, wrapper } = createWrapper();

    const list = renderHook(() => useApprovalList({ status: "PENDING" }), {
      wrapper,
    });
    await waitFor(() => expect(list.result.current.isLoading).toBe(false));
    const cachedList = queryClient.getQueryData(approvalKeys.list({ status: "PENDING" }));

    renderHook(() => useApprovalDetail("app-1"), { wrapper });
    await waitFor(() =>
      expect(queryClient.getQueryData(approvalKeys.detail("app-1"))).toBeDefined(),
    );

    expect(
      queryClient.getQueryData(approvalKeys.list({ status: "PENDING" })),
    ).toEqual(cachedList);
  });
});
