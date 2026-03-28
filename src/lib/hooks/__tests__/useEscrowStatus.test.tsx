import {
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEscrowStatus } from "../../../hooks/useEscrowStatus";
import { adoptionService } from "../../../api/adoptionService";
import type { AdoptionDetails } from "../../../types/adoption";

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

const baseAdoption: AdoptionDetails = {
  id: "adoption-1",
  status: "ESCROW_FUNDED",
  petId: "pet-1",
  adopterId: "user-1",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("useEscrowStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks the query as settled when status is COMPLETED", async () => {
    const queryClient = createTestQueryClient();
    const fetchSpy = vi
      .spyOn(adoptionService, "getDetails")
      .mockResolvedValue({
        ...baseAdoption,
        status: "COMPLETED",
      });

    const { result } = renderHook(() => useEscrowStatus("adoption-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result.current.isSettled).toBe(true);
    });
  });

  it("continues polling when status is ESCROW_FUNDED", async () => {
    const queryClient = createTestQueryClient();
    const fetchSpy = vi
      .spyOn(adoptionService, "getDetails")
      .mockResolvedValue(baseAdoption);

    renderHook(() => useEscrowStatus("adoption-2"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2), {
      timeout: 5000,
    });
  });
});
