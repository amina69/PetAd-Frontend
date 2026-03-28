import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { useApiMutation } from "../useApiMutation";
import { ApiError } from "../../lib/api-errors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh QueryClient + wrapper for each test */
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useApiMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Basic happy-path ───────────────────────────────────────────────────────

  it("calls mutationFn and returns data on success", async () => {
    const mockData = { id: "1", name: "Buddy" };
    const mutationFn = vi.fn().mockResolvedValue(mockData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useApiMutation<typeof mockData, { name: string }>(mutationFn),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ name: "Buddy" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // TanStack Query v5 passes a second context object to mutationFn, so we
    // only assert on the first (variables) argument.
    expect(mutationFn).toHaveBeenCalledWith(
      { name: "Buddy" },
      expect.objectContaining({ client: expect.anything() }),
    );
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── Rollback on error ──────────────────────────────────────────────────────

  it("calls onRollback with the snapshot when the mutation fails", async () => {
    const snapshot = { pets: [{ id: "old" }] };
    const onOptimisticUpdate = vi.fn().mockReturnValue(snapshot);
    const onRollback = vi.fn();
    const apiError = new ApiError("Server error", { status: 500 });
    const mutationFn = vi.fn().mockRejectedValue(apiError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useApiMutation<void, { name: string }>(mutationFn, {
          onOptimisticUpdate,
          onRollback,
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ name: "Shadow" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onOptimisticUpdate).toHaveBeenCalledWith({ name: "Shadow" });
    expect(onRollback).toHaveBeenCalledTimes(1);
    // First arg must be the snapshot, second must be the ApiError
    expect(onRollback).toHaveBeenCalledWith(snapshot, apiError);
    expect(result.current.error).toBe(apiError);
  });

  it("does not throw when onRollback is not provided", async () => {
    const mutationFn = vi
      .fn()
      .mockRejectedValue(new ApiError("Oops", { status: 500 }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useApiMutation<void, void>(mutationFn),
      { wrapper },
    );

    act(() => {
      result.current.mutate(undefined as void);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // No crash – test simply completing is enough
  });

  // ── Query invalidation on success ─────────────────────────────────────────

  it("invalidates the specified query keys after a successful mutation", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ ok: true });
    const { queryClient, wrapper } = createWrapper();

    // Pre-seed a couple of queries so we can spy on invalidation
    queryClient.setQueryData(["pets"], [{ id: "1" }]);
    queryClient.setQueryData(["adoptions"], [{ id: "a1" }]);

    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useApiMutation<{ ok: boolean }, void>(mutationFn, {
          invalidates: [["pets"], ["adoptions"]],
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate(undefined as void);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // invalidateQueries should have been called once for each key
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["pets"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["adoptions"],
    });
  });

  it("does not invalidate any queries when invalidates is not provided", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ ok: true });
    const { queryClient, wrapper } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useApiMutation<{ ok: boolean }, void>(mutationFn),
      { wrapper },
    );

    act(() => {
      result.current.mutate(undefined as void);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  // ── Optimistic update ──────────────────────────────────────────────────────

  it("calls onOptimisticUpdate before the mutationFn fires", async () => {
    const callOrder: string[] = [];
    const mutationFn = vi.fn().mockImplementation(async () => {
      callOrder.push("mutationFn");
      return { ok: true };
    });
    const onOptimisticUpdate = vi.fn().mockImplementation(() => {
      callOrder.push("onOptimisticUpdate");
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useApiMutation<{ ok: boolean }, void>(mutationFn, {
          onOptimisticUpdate,
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate(undefined as void);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(callOrder[0]).toBe("onOptimisticUpdate");
    expect(callOrder[1]).toBe("mutationFn");
  });

  // ── onSuccess callback ─────────────────────────────────────────────────────

  it("calls onSuccess with data and variables after a successful mutation", async () => {
    const mockData = { id: "42" };
    const mutationFn = vi.fn().mockResolvedValue(mockData);
    const onSuccess = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useApiMutation<typeof mockData, { name: string }>(mutationFn, {
          onSuccess,
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ name: "Max" });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(onSuccess).toHaveBeenCalledWith(mockData, { name: "Max" });
  });

  // ── mutateAsync ────────────────────────────────────────────────────────────

  it("mutateAsync resolves with the returned data", async () => {
    const mockData = { id: "99" };
    const mutationFn = vi.fn().mockResolvedValue(mockData);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useApiMutation<typeof mockData, void>(mutationFn),
      { wrapper },
    );

    let resolved: typeof mockData | undefined;
    await act(async () => {
      resolved = await result.current.mutateAsync(undefined as void);
    });

    expect(resolved).toEqual(mockData);
  });

  it("mutateAsync rejects when the mutation fails", async () => {
    const apiError = new ApiError("Bad request", { status: 400 });
    const mutationFn = vi.fn().mockRejectedValue(apiError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useApiMutation<void, void>(mutationFn),
      { wrapper },
    );

    await expect(
      act(async () => {
        await result.current.mutateAsync(undefined as void);
      }),
    ).rejects.toThrow("Bad request");
  });
});
