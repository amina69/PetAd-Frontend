import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";
import React from "react";
import { useApprovalList } from "../useApprovalList";
import { server } from "../../../../mocks/server";
import type { ApprovalListParams } from "../../types/approval.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("useApprovalList", () => {
  it("returns { data, isLoading, isError, error, refetch } and fetches approval list successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApprovalList(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe("function");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data?.items)).toBe(true);
    expect(result.current.data?.items.length).toBeGreaterThan(0);
  });

  it("changing params.status produces a new query key and triggers a new network call (asserting MSW call count)", async () => {
    let callCount = 0;
    const requestedStatuses: (string | null)[] = [];

    server.use(
      http.get("http://localhost:3000/api/approvals", ({ request }) => {
        callCount++;
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        requestedStatuses.push(status);

        return HttpResponse.json({
          items: [
            {
              id: `app-${callCount}`,
              status: status || "ALL",
              petName: "Buddy",
              applicantName: "John Doe",
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        });
      })
    );

    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      (params: ApprovalListParams) => useApprovalList(params),
      {
        wrapper,
        initialProps: { status: "PENDING" },
      }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(callCount).toBe(1);
    expect(requestedStatuses[0]).toBe("PENDING");
    expect(result.current.data?.items[0].status).toBe("PENDING");

    // Change params.status to "APPROVED" -> triggers a new query key & network call
    rerender({ status: "APPROVED" });

    await waitFor(() => expect(callCount).toBe(2));
    expect(requestedStatuses[1]).toBe("APPROVED");
    expect(result.current.data?.items[0].status).toBe("APPROVED");

    // Change params.status to "REJECTED" -> triggers a 3rd network call
    rerender({ status: "REJECTED" });

    await waitFor(() => expect(callCount).toBe(3));
    expect(requestedStatuses[2]).toBe("REJECTED");
    expect(result.current.data?.items[0].status).toBe("REJECTED");
  });

  it("changing params.page produces a new query key and triggers a new network call (asserting MSW call count)", async () => {
    let callCount = 0;
    const requestedPages: (string | null)[] = [];

    server.use(
      http.get("http://localhost:3000/api/approvals", ({ request }) => {
        callCount++;
        const url = new URL(request.url);
        const page = url.searchParams.get("page");
        requestedPages.push(page);

        return HttpResponse.json({
          items: [
            {
              id: `app-page-${page}`,
              petName: `Pet Page ${page}`,
              applicantName: "Adopter",
            },
          ],
          total: 20,
          page: Number(page) || 1,
          limit: 10,
        });
      })
    );

    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      (params: ApprovalListParams) => useApprovalList(params),
      {
        wrapper,
        initialProps: { page: 1, limit: 10 },
      }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(callCount).toBe(1);
    expect(requestedPages[0]).toBe("1");
    expect(result.current.data?.page).toBe(1);

    // Change params.page to 2 -> triggers a new query key & network call
    rerender({ page: 2, limit: 10 });

    await waitFor(() => expect(callCount).toBe(2));
    expect(requestedPages[1]).toBe("2");
    expect(result.current.data?.page).toBe(2);

    // Change params.page to 3 -> triggers a 3rd network call
    rerender({ page: 3, limit: 10 });

    await waitFor(() => expect(callCount).toBe(3));
    expect(requestedPages[2]).toBe("3");
    expect(result.current.data?.page).toBe(3);
  });

  it("handles network and API error states correctly", async () => {
    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        return new HttpResponse(JSON.stringify({ message: "Internal Server Error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApprovalList({ status: "PENDING" }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toBeUndefined();
  });

  it("refetch() triggers an explicit refetch", async () => {
    let callCount = 0;

    server.use(
      http.get("http://localhost:3000/api/approvals", () => {
        callCount++;
        return HttpResponse.json({
          items: [{ id: `app-${callCount}`, petName: "Buddy" }],
          total: 1,
        });
      })
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApprovalList({ status: "PENDING" }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(callCount).toBe(1);

    await result.current.refetch();

    expect(callCount).toBe(2);
  });
});
