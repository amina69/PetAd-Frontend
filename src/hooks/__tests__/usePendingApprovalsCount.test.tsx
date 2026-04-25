import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePendingApprovalsCount } from "../usePendingApprovalsCount";
import { shelterService } from "../../api/shelterService";
import type { ReactNode } from "react";

vi.mock("../../api/shelterService");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  return Wrapper;
};

describe("usePendingApprovalsCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return count 0 when user is not authorized", () => {
    const { result } = renderHook(
      () => usePendingApprovalsCount("user"),
      { wrapper: createWrapper() }
    );

    expect(result.current.count).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(shelterService.getPendingApprovalsCount).not.toHaveBeenCalled();
  });

  it("should fetch and return count for admin role", async () => {
    vi.mocked(shelterService.getPendingApprovalsCount).mockResolvedValue({
      count: 5,
    });

    const { result } = renderHook(
      () => usePendingApprovalsCount("admin"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(5);
    expect(shelterService.getPendingApprovalsCount).toHaveBeenCalledTimes(1);
  });

  it("should fetch and return count for shelter role", async () => {
    vi.mocked(shelterService.getPendingApprovalsCount).mockResolvedValue({
      count: 3,
    });

    const { result } = renderHook(
      () => usePendingApprovalsCount("shelter"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(3);
    expect(shelterService.getPendingApprovalsCount).toHaveBeenCalledTimes(1);
  });

  it("should return 0 when API returns no count", async () => {
    vi.mocked(shelterService.getPendingApprovalsCount).mockResolvedValue({
      count: 0,
    });

    const { result } = renderHook(
      () => usePendingApprovalsCount("admin"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(0);
  });

  it("should handle API errors gracefully", async () => {
    vi.mocked(shelterService.getPendingApprovalsCount).mockRejectedValue(
      new Error("API Error")
    );

    const { result } = renderHook(
      () => usePendingApprovalsCount("admin"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.count).toBe(0);
    expect(result.current.isError).toBe(true);
  });

  it("should not fetch when role is null", () => {
    const { result } = renderHook(
      () => usePendingApprovalsCount(null),
      { wrapper: createWrapper() }
    );

    expect(result.current.count).toBe(0);
    expect(shelterService.getPendingApprovalsCount).not.toHaveBeenCalled();
  });
});
