import { describe, it, expect, vi, beforeEach } from "vitest";
import {adoptionService, type StatusOverride} from "../../api/adoptionService"
import {useMutateAdminStatusOverride} from "../useMutateAdminStatusOverride"
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook as baseRenderHook, type RenderHookOptions, act } from "@testing-library/react";

interface WrapperWithClient {
  ({ children }: { children: React.ReactNode }): React.ReactElement;
  __queryClient?: QueryClient;
}
 
export function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries:   { retry: false },
      mutations: { retry: false },
    },
  });
 
  const Wrapper: WrapperWithClient = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
 
  // Stash the client so renderHook callers can access it
  Wrapper.__queryClient = queryClient;
 
  return Wrapper;
}
 
/**
 * Thin re-export of renderHook that also returns the queryClient attached
 * to the wrapper, if one was created via createWrapper().
 */
export function renderHook<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options: RenderHookOptions<TProps> & { wrapper?: ReturnType<typeof createWrapper> },
) {
  const base = baseRenderHook(callback, options);
  const queryClient: QueryClient | undefined = (options.wrapper as WrapperWithClient)?.__queryClient;
  return { ...base, queryClient: queryClient! };
}

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../api/adoptionService", () => ({
  adoptionService: {
    editStatus: vi.fn(),
  },
}));

const mockEditStatus = vi.mocked(adoptionService.editStatus);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ADOPTION_ID = "adoption-123";
const STATUS_PAYLOAD: StatusOverride = { status: "approved", reason: "testing" };

// ── Tests ─────────────────────────────────────────────────────────────────────

 
describe("useMutateAdminStatusOverride", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
 
  it("calls adoptionService.editStatus with the correct adoptionId and payload", async () => {
    mockEditStatus.mockResolvedValueOnce([]);
 
    const { result } = renderHook(
      () => useMutateAdminStatusOverride(ADOPTION_ID),
      { wrapper: createWrapper() },
    );
 
    await act(() => result.current.mutateAsync(STATUS_PAYLOAD));
 
    expect(mockEditStatus).toHaveBeenCalledOnce();
    expect(mockEditStatus).toHaveBeenCalledWith(ADOPTION_ID, STATUS_PAYLOAD);
  });
 
  it("calls adoptionService.editStatus with a different adoptionId when the hook argument changes", async () => {
    mockEditStatus.mockResolvedValueOnce([]);
    const otherId = "adoption-999";
 
    const { result } = renderHook(
      () => useMutateAdminStatusOverride(otherId),
      { wrapper: createWrapper() },
    );
 
    await act(() => result.current.mutateAsync(STATUS_PAYLOAD));
 
    expect(mockEditStatus).toHaveBeenCalledWith(otherId, STATUS_PAYLOAD);
  });
 
  it("invalidates the ['adoption', adoptionId] query on success", async () => {
    mockEditStatus.mockResolvedValueOnce([]);
 
    const { result, queryClient } = renderHook(
      () => useMutateAdminStatusOverride(ADOPTION_ID),
      { wrapper: createWrapper() },
    );
 
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
 
    await act(() => result.current.mutateAsync(STATUS_PAYLOAD));
 
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["adoption", ADOPTION_ID],
    });
  });
 
  it("does not call editStatus more than once per mutateAsync invocation", async () => {
    mockEditStatus.mockResolvedValueOnce([]);
 
    const { result } = renderHook(
      () => useMutateAdminStatusOverride(ADOPTION_ID),
      { wrapper: createWrapper() },
    );
 
    await act(() => result.current.mutateAsync(STATUS_PAYLOAD));
 
    expect(mockEditStatus).toHaveBeenCalledTimes(1);
  });
 
  it("is not pending before mutateAsync is called", () => {
    const { result } = renderHook(
      () => useMutateAdminStatusOverride(ADOPTION_ID),
      { wrapper: createWrapper() },
    );
 
    expect(result.current.isPending).toBe(false);
  });
 
  it("does not invalidate queries when editStatus rejects", async () => {
    mockEditStatus.mockRejectedValueOnce(new Error("Server error"));
 
    const { result, queryClient } = renderHook(
      () => useMutateAdminStatusOverride(ADOPTION_ID),
      { wrapper: createWrapper() },
    );
 
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
 
    await act(async () => {
      await result.current.mutateAsync(STATUS_PAYLOAD).catch(() => {});
    });
 
    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: ["adoption", ADOPTION_ID],
    });
  });
});