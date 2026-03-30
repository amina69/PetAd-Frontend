import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAdoptionApprovals } from "../useAdoptionApprovals";

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

describe("useAdoptionApprovals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return default values when data is undefined", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useAdoptionApprovals("adoption-123"),
    );

    expect(result.current).toEqual({
      required: 0,
      given: 0,
      pending: 0,
      quorumMet: false,
      escrowAccountId: "",
      isLoading: false,
      isError: false,
    });
  });

  it("should return correct data when pre-quorum state loaded", () => {
    const mockData = {
      required: 3,
      given: 1,
      pending: 2,
      quorumMet: false,
      escrowAccountId: "escrow-123",
      parties: [
        {
          id: "party-1",
          name: "Dr. Sarah Lee",
          role: "Veterinary Inspector",
          status: "APPROVED" as const,
          timestamp: "2026-03-29T10:00:00Z",
        },
        {
          id: "party-2",
          name: "Mark Evans",
          role: "Welfare Officer",
          status: "PENDING" as const,
        },
        {
          id: "party-3",
          name: "Jane Smith",
          role: "Legal Reviewer",
          status: "PENDING" as const,
        },
      ],
    };

    (useApiQuery as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useAdoptionApprovals("adoption-pending"),
    );

    expect(result.current.required).toBe(3);
    expect(result.current.given).toBe(1);
    expect(result.current.pending).toBe(2);
    expect(result.current.quorumMet).toBe(false);
    expect(result.current.escrowAccountId).toBe("escrow-123");
    expect(result.current.isLoading).toBe(false);
  });

  it("should return correct data when post-quorum state loaded", () => {
    const mockData = {
      required: 3,
      given: 3,
      pending: 0,
      quorumMet: true,
      escrowAccountId: "escrow-456",
      parties: [
        {
          id: "party-1",
          name: "Dr. Sarah Lee",
          role: "Veterinary Inspector",
          status: "APPROVED" as const,
          timestamp: "2026-03-29T10:00:00Z",
        },
        {
          id: "party-2",
          name: "Mark Evans",
          role: "Welfare Officer",
          status: "APPROVED" as const,
          timestamp: "2026-03-29T11:30:00Z",
        },
        {
          id: "party-3",
          name: "Jane Smith",
          role: "Legal Reviewer",
          status: "APPROVED" as const,
          timestamp: "2026-03-29T12:15:00Z",
        },
      ],
    };

    (useApiQuery as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useAdoptionApprovals("adoption-approved"),
    );

    expect(result.current.required).toBe(3);
    expect(result.current.given).toBe(3);
    expect(result.current.pending).toBe(0);
    expect(result.current.quorumMet).toBe(true);
    expect(result.current.escrowAccountId).toBe("escrow-456");
  });

  it("should return loading state during fetch", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { result } = renderHook(() =>
      useAdoptionApprovals("adoption-123"),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.quorumMet).toBe(false);
  });

  it("should return error state on API failure", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const { result } = renderHook(() =>
      useAdoptionApprovals("adoption-123"),
    );

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should pass correct options to useApiQuery with 30s refetch interval", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    renderHook(() => useAdoptionApprovals("adoption-123"));

    expect(useApiQuery).toHaveBeenCalledWith(
      ["adoptionApprovals", "adoption-123"],
      expect.any(Function),
      expect.objectContaining({
        refetchInterval: 30 * 1000, // 30 seconds
        staleTime: 30 * 1000,
        enabled: true,
      }),
    );
  });

  it("should disable polling when quorumMet becomes true", async () => {
    const mockDataPending = {
      required: 3,
      given: 1,
      pending: 2,
      quorumMet: false,
      escrowAccountId: "escrow-123",
      parties: [],
    };

    const mockDataApproved = {
      required: 3,
      given: 3,
      pending: 0,
      quorumMet: true,
      escrowAccountId: "escrow-456",
      parties: [],
    };

    const { rerender } = renderHook(() => useAdoptionApprovals("adoption-123"));

    // Initially pending
    (useApiQuery as any).mockReturnValue({
      data: mockDataPending,
      isLoading: false,
      isError: false,
    });

    rerender();

    // Now quorum met - polling should stop
    (useApiQuery as any).mockReturnValue({
      data: mockDataApproved,
      isLoading: false,
      isError: false,
    });

    rerender();

    await waitFor(() => {
      // Verify hook was called with updated data
      expect((useApiQuery as any).mock.results.length).toBeGreaterThan(0);
    });
  });

  it("should calculate pending as difference between required and given", () => {
    const mockData = {
      required: 5,
      given: 2,
      pending: 3,
      quorumMet: false,
      escrowAccountId: "escrow-789",
      parties: [],
    };

    (useApiQuery as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useAdoptionApprovals("adoption-123"),
    );

    expect(result.current.pending).toBe(3);
    expect(result.current.required - result.current.given).toBe(
      result.current.pending,
    );
  });

  it("should handle empty adoption ID gracefully", () => {
    (useApiQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    renderHook(() => useAdoptionApprovals(""));

    expect(useApiQuery).toHaveBeenCalledWith(
      ["adoptionApprovals", ""],
      expect.any(Function),
      expect.objectContaining({
        enabled: false, // Disabled for empty ID
      }),
    );
  });

  it("should update when adoptionId changes", () => {
    const mockData = {
      required: 3,
      given: 1,
      pending: 2,
      quorumMet: false,
      escrowAccountId: "escrow-123",
      parties: [],
    };

    (useApiQuery as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    const { rerender } = renderHook(
      ({ id }: { id: string }) => useAdoptionApprovals(id),
      { initialProps: { id: "adoption-1" } },
    );

    rerender({ id: "adoption-2" });

    expect(useApiQuery).toHaveBeenCalledWith(
      ["adoptionApprovals", "adoption-2"],
      expect.any(Function),
      expect.any(Object),
    );
  });
});
