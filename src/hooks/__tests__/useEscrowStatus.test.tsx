import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useEscrowStatus } from "../useEscrowStatus";
import { server } from "../../mocks/server";
import { describe, it, expect } from "vitest";
import React from "react";
import type { AdoptionDetails } from "../../types/adoption";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Disable polling during tests unless explicitly needed
        refetchInterval: false,
      },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const BASE_ADOPTION: AdoptionDetails = {
  id: "adoption-1",
  status: "ESCROW_FUNDED",
  petId: "pet-1",
  adopterId: "user-1",
  createdAt: "2026-03-25T10:00:00Z",
  updatedAt: "2026-03-25T10:10:00Z",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useEscrowStatus", () => {
  it("polling active: isSettled is false and refetchInterval is non-false while status is non-terminal", async () => {
    // Handler returns a non-terminal status → polling should remain active
    server.use(
      http.get("http://localhost:3000/api/adoption/:id", () => {
        return HttpResponse.json<AdoptionDetails>({
          ...BASE_ADOPTION,
          status: "ESCROW_FUNDED",
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEscrowStatus("adoption-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Data fetched with non-terminal status
    expect(result.current.data?.status).toBe("ESCROW_FUNDED");
    // isSettled must be false → the hook's refetchInterval function will return 3000 (polling on)
    expect(result.current.isSettled).toBe(false);
  });

  it("stops polling on COMPLETED: isSettled becomes true", async () => {
    server.use(
      http.get("http://localhost:3000/api/adoption/:id", () => {
        return HttpResponse.json<AdoptionDetails>({
          ...BASE_ADOPTION,
          status: "COMPLETED",
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEscrowStatus("adoption-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.status).toBe("COMPLETED");
    // COMPLETED is a terminal status → isSettled must be true → refetchInterval returns false
    expect(result.current.isSettled).toBe(true);
  });

  it("stops polling on CANCELLED: isSettled becomes true", async () => {
    server.use(
      http.get("http://localhost:3000/api/adoption/:id", () => {
        return HttpResponse.json<AdoptionDetails>({
          ...BASE_ADOPTION,
          status: "CANCELLED",
        });
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEscrowStatus("adoption-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // CANCELLED is also a terminal status
    expect(result.current.isSettled).toBe(true);
  });

  it("does not fetch when adoptionId is empty string (query disabled)", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEscrowStatus(""), { wrapper });

    // When `enabled: false`, TanStack Query v5 stays in 'pending' state (isPending = true)
    // but isLoading is false because the query hasn't started
    expect(result.current.data).toBeUndefined();
    expect(result.current.isSettled).toBe(false);
    // isError is false because we haven't tried to fetch
    expect(result.current.isError).toBe(false);
  });
});
