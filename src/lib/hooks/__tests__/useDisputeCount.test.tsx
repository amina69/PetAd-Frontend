import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useDisputeCount } from "../useDisputeCount";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUseRoleGuard = vi.fn();
vi.mock("../../../hooks/useRoleGuard", () => ({
  useRoleGuard: () => mockUseRoleGuard(),
}));

const mockGet = vi.fn();
vi.mock("../../api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function createWrapper(queryClient: QueryClient, initialPath = "/home") {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("useDisputeCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin sees total count of open and under_review disputes", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: true, isUser: false, role: "admin" });
    // open: 2 disputes, under_review: 1 dispute → total: 3
    mockGet
      .mockResolvedValueOnce({ data: [{ id: "d1" }, { id: "d2" }] })
      .mockResolvedValueOnce({ data: [{ id: "d3" }] });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.count).toBe(3));
    expect(result.current.displayCount).toBe("3");
  });

  it("admin fetches both open and under_review endpoints", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: true, isUser: false, role: "admin" });
    mockGet
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    const queryClient = createTestQueryClient();
    renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockGet).toHaveBeenCalledWith("/disputes?status=open");
    expect(mockGet).toHaveBeenCalledWith("/disputes?status=under_review");
  });

  it("user sees only their own open disputes (single endpoint)", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: false, isUser: true, role: "user" });
    mockGet.mockResolvedValueOnce({ data: [{ id: "d1" }] });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.count).toBe(1));
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("/disputes?status=open");
  });

  it("displays '9+' when count exceeds 9", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: true, isUser: false, role: "admin" });
    // open: 7, under_review: 5 → total: 12
    mockGet
      .mockResolvedValueOnce({ data: Array.from({ length: 7 }, (_, i) => ({ id: `o${i}` })) })
      .mockResolvedValueOnce({ data: Array.from({ length: 5 }, (_, i) => ({ id: `u${i}` })) });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.count).toBe(12));
    expect(result.current.displayCount).toBe("9+");
  });

  it("displays exact count when count is exactly 9", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: false, isUser: true, role: "user" });
    mockGet.mockResolvedValueOnce({
      data: Array.from({ length: 9 }, (_, i) => ({ id: `d${i}` })),
    });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.count).toBe(9));
    expect(result.current.displayCount).toBe("9");
  });

  it("resets count to 0 when user visits /disputes", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: false, isUser: true, role: "user" });
    mockGet.mockResolvedValue({ data: [] });

    const queryClient = createTestQueryClient();
    // Pre-populate cache so the reset effect has something to clear
    queryClient.setQueryData(["dispute-count", "user"], 5);

    const { result } = renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient, "/disputes"),
    });

    await waitFor(() => expect(result.current.count).toBe(0));
  });

  it("resets count to 0 when admin visits /admin/disputes", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: true, isUser: false, role: "admin" });
    mockGet.mockResolvedValue({ data: [] });

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["dispute-count", "admin"], 7);

    const { result } = renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient, "/admin/disputes"),
    });

    await waitFor(() => expect(result.current.count).toBe(0));
  });

  it("does not reset count when visiting an unrelated route", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: false, isUser: true, role: "user" });
    // refetchOnMount: false → cached value persists, no immediate fetch
    mockGet.mockResolvedValue({ data: [] });

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["dispute-count", "user"], 3);

    const { result } = renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient, "/home"),
    });

    // Allow effects to settle — count must NOT be zeroed
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.count).toBe(3);
  });

  it("returns count 0 when no disputes exist", async () => {
    mockUseRoleGuard.mockReturnValue({ isAdmin: false, isUser: true, role: "user" });
    mockGet.mockResolvedValueOnce({ data: [] });

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useDisputeCount(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.count).toBe(0);
    expect(result.current.displayCount).toBe("0");
  });
});