import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePendingApprovals } from "../usePendingApprovals";

// Mock the dependencies
vi.mock("../../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock("../useApiQuery", () => ({
  useApiQuery: vi.fn(),
}));

import { useApiQuery } from "../useApiQuery";

describe("usePendingApprovals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default values when data is undefined", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isForbidden: false,
    });

    const { result } = renderHook(() => usePendingApprovals());

    expect(result.current).toEqual({
      approvalsData: undefined,
      isLoading: false,
      isError: false,
      isForbidden: false,
      pendingCount: 0,
    });
  });

  it("should return correct data when loaded", () => {
    const mockData = {
      data: [
        {
          id: "1",
          status: "PENDING" as const,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "2",
          status: "PENDING" as const,
          createdAt: "2026-01-02",
          updatedAt: "2026-01-02",
        },
      ],
      total: 2,
      limit: 0,
      offset: 0,
    };

    (useApiQuery as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      isForbidden: false,
    });

    const { result } = renderHook(() => usePendingApprovals());

    expect(result.current.approvalsData).toEqual(mockData);
    expect(result.current.pendingCount).toBe(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("should return loading state during initial fetch", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isForbidden: false,
    });

    const { result } = renderHook(() => usePendingApprovals());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.pendingCount).toBe(0);
  });

  it("should return error state on failure", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isForbidden: false,
    });

    const { result } = renderHook(() => usePendingApprovals());

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should return forbidden state on 403 error", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isForbidden: true,
    });

    const { result } = renderHook(() => usePendingApprovals());

    expect(result.current.isForbidden).toBe(true);
    expect(result.current.pendingCount).toBe(0);
  });

  it("should pass correct options to useApiQuery", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isForbidden: false,
    });

    renderHook(() => usePendingApprovals());

    expect(useApiQuery).toHaveBeenCalledWith(
      ["pendingApprovals"],
      expect.any(Function),
      {
        refetchInterval: 5 * 60 * 1000, // 5 minutes
        staleTime: 5 * 60 * 1000,
      },
    );
  });

  it("should handle large pending counts correctly", () => {
    const mockData = {
      data: Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        status: "PENDING" as const,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      })),
      total: 50,
      limit: 0,
      offset: 0,
    };

    (useApiQuery as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      isForbidden: false,
    });

    const { result } = renderHook(() => usePendingApprovals());

    expect(result.current.pendingCount).toBe(50);
    expect(result.current.approvalsData?.total).toBe(50);
  });

  it("should return count of 0 when total is null", () => {
    const mockData = {
      data: [],
      total: null,
      limit: 0,
      offset: 0,
    };

    (useApiQuery as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      isForbidden: false,
    });

    const { result } = renderHook(() => usePendingApprovals());

    expect(result.current.pendingCount).toBe(0);
  });
});
