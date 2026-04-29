import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useAdoptionApprovals } from "../useAdoptionApprovals";
import { server } from "../../mocks/server";
import { preQuorumHandler } from "../../mocks/handlers/adoptionApprovals";
import { http, HttpResponse } from "msw";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useAdoptionApprovals", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    server.resetHandlers();
  });

  it("stops polling when quorumMet becomes true", async () => {
    const adoptionId = "test-adoption-1";
    let requestCount = 0;

    // Start with pre-quorum handler and track requests
    server.use(
      http.get(`*/api/adoption/${adoptionId}/approvals`, async () => {
        requestCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          required: 3,
          given: 1,
          quorumMet: false,
          escrowAccountId: null,
        });
      })
    );

    const { result } = renderHook(() => useAdoptionApprovals(adoptionId), {
      wrapper: createWrapper(),
    });

    // Wait for initial data to load
    await vi.advanceTimersByTimeAsync(100);
    await waitFor(() => expect(result.current.quorumMet).toBe(false));
    expect(result.current.given).toBe(1);
    expect(result.current.required).toBe(3);

    const requestCountAfterInitial = requestCount;

    // Advance 30s - should trigger another poll
    await vi.advanceTimersByTimeAsync(30000);
    await waitFor(() => expect(requestCount).toBeGreaterThan(requestCountAfterInitial));

    // Now swap to post-quorum handler
    server.use(
      http.get(`*/api/adoption/${adoptionId}/approvals`, async () => {
        requestCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({
          required: 3,
          given: 3,
          quorumMet: true,
          escrowAccountId: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        });
      })
    );

    // Advance 30s - should trigger one more poll that gets quorum data
    await vi.advanceTimersByTimeAsync(30000);
    await waitFor(() => expect(result.current.quorumMet).toBe(true));
    expect(result.current.given).toBe(3);
    expect(result.current.escrowAccountId).toBe(
      "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    );

    const requestCountAtQuorum = requestCount;

    // Advance 60s more - polling should have stopped
    await vi.advanceTimersByTimeAsync(60000);
    
    // Wait a bit to ensure no new requests were made
    await vi.advanceTimersByTimeAsync(100);
    
    // Request count should not have increased
    expect(requestCount).toBe(requestCountAtQuorum);
  });

  it("calculates pending correctly", async () => {
    const adoptionId = "test-adoption-2";

    server.use(preQuorumHandler(adoptionId));

    const { result } = renderHook(() => useAdoptionApprovals(adoptionId), {
      wrapper: createWrapper(),
    });

    await vi.advanceTimersByTimeAsync(100);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.required).toBe(3);
    expect(result.current.given).toBe(1);
    expect(result.current.pending).toBe(2);
  });

  it("does not fetch when adoptionId is empty", async () => {
    let requestMade = false;

    server.use(
      http.get("*/api/adoption/*/approvals", async () => {
        requestMade = true;
        return HttpResponse.json({
          required: 3,
          given: 1,
          quorumMet: false,
          escrowAccountId: null,
        });
      })
    );

    const { result } = renderHook(() => useAdoptionApprovals(""), {
      wrapper: createWrapper(),
    });

    await vi.advanceTimersByTimeAsync(100);

    // Should not have made a request
    expect(requestMade).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("sets isLoading true initially", async () => {
    const adoptionId = "test-adoption-3";

    server.use(preQuorumHandler(adoptionId));

    const { result } = renderHook(() => useAdoptionApprovals(adoptionId), {
      wrapper: createWrapper(),
    });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);

    await vi.advanceTimersByTimeAsync(100);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // After data loads, should not be loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.given).toBe(1);
  });

  it("sets isError true on API failure", async () => {
    const adoptionId = "test-adoption-4";

    server.use(
      http.get(`*/api/adoption/${adoptionId}/approvals`, async () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useAdoptionApprovals(adoptionId), {
      wrapper: createWrapper(),
    });

    await vi.advanceTimersByTimeAsync(100);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});
