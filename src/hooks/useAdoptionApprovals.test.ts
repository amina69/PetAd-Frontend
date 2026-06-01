import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { useAdoptionApprovals } from "./useAdoptionApprovals";
import { adoptionService } from "../api/adoptionService";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const PRE_QUORUM = {
  required: 3,
  given: [
    {
      id: "dec-1",
      approverName: "Alice",
      approverRole: "Vet",
      status: "APPROVED",
      timestamp: "2026-01-01T00:00:00Z",
    },
  ],
  pending: 2,
  quorumMet: false,
  escrowAccountId: "escrow-abc",
};

const POST_QUORUM = {
  required: 3,
  given: [
    { id: "dec-1", approverName: "Alice", approverRole: "Vet", status: "APPROVED", timestamp: "2026-01-01T00:00:00Z" },
    { id: "dec-2", approverName: "Bob", approverRole: "Officer", status: "APPROVED", timestamp: "2026-01-01T01:00:00Z" },
    { id: "dec-3", approverName: "Carol", approverRole: "Inspector", status: "APPROVED", timestamp: "2026-01-01T02:00:00Z" },
  ],
  pending: 0,
  quorumMet: true,
  escrowAccountId: "escrow-abc",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAdoptionApprovals", () => {
  it("fetches and returns pre-quorum approval state", async () => {
    server.use(
      http.get("*/api/adoption/:id/approvals", () => HttpResponse.json(PRE_QUORUM))
    );

    const { result } = renderHook(
      () => useAdoptionApprovals("adoption-1"),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.quorumMet).toBe(false);
    expect(result.current.required).toBe(3);
    expect(result.current.given).toHaveLength(1);
    expect(result.current.pending).toBe(2);
    expect(result.current.escrowAccountId).toBe("escrow-abc");
    expect(result.current.isError).toBe(false);
  });

  it("fetches and returns post-quorum approval state", async () => {
    server.use(
      http.get("*/api/adoption/:id/approvals", () => HttpResponse.json(POST_QUORUM))
    );

    const { result } = renderHook(
      () => useAdoptionApprovals("adoption-quorum"),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.quorumMet).toBe(true);
    expect(result.current.given).toHaveLength(3);
    expect(result.current.pending).toBe(0);
  });

  it("polling stops when quorumMet is true", async () => {
    server.use(
      http.get("*/api/adoption/:id/approvals", () => HttpResponse.json(POST_QUORUM))
    );

    const spy = vi.spyOn(adoptionService, "getApprovals");

    const { result } = renderHook(
      () => useAdoptionApprovals("adoption-quorum"),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.quorumMet).toBe(true));

    const fetchCount = spy.mock.calls.length;

    // Polling interval is 30 000ms; a 300ms real-time wait confirms the
    // refetchInterval returned false and no timer was scheduled.
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(spy.mock.calls.length).toBe(fetchCount);
  });
});
