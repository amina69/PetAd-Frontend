import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRealTimeStatusPolling } from "../useRealTimeStatusPolling";
import * as adoptionService from "../../../api/adoptionService";
import type { AdoptionDetails } from "../../../types/adoption";
import type { ReactNode } from "react";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockAdoptionData: AdoptionDetails = {
  id: "adoption-1",
  status: "ESCROW_CREATED",
  petId: "pet-1",
  adopterId: "user-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("useRealTimeStatusPolling - Simple Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch initial data", async () => {
    const queryClient = createTestQueryClient();
    const mockGetDetails = vi
      .spyOn(adoptionService.adoptionService, "getDetails")
      .mockResolvedValue(mockAdoptionData);

    const { result } = renderHook(
      () => useRealTimeStatusPolling("adoption", "adoption-1", { intervalMs: 1000 }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockAdoptionData);
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetDetails).toHaveBeenCalledWith("adoption-1");
    expect(mockGetDetails).toHaveBeenCalledTimes(1);
    expect(result.current.statusChanged).toBe(false);
  });

  it("should throw error for invalid entity type", () => {
    const queryClient = createTestQueryClient();

    expect(() => {
      renderHook(
        // @ts-expect-error - Testing invalid entity type
        () => useRealTimeStatusPolling("invalid", "id-1"),
        { wrapper: createWrapper(queryClient) }
      );
    }).toThrow("Unsupported entity type: invalid");
  });
});
