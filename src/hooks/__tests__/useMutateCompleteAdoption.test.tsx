import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useMutateCompleteAdoption } from "../useMutateCompleteAdoption";
import { server } from "../../mocks/server";
import { describe, it, expect } from "vitest";
import React from "react";
import type { AdoptionDetails } from "../../types/adoption";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const MOCK_ADOPTION: AdoptionDetails = {
  id: "adoption-1",
  status: "ESCROW_FUNDED",
  petId: "pet-1",
  adopterId: "user-1",
  createdAt: "2026-03-25T10:00:00Z",
  updatedAt: "2026-03-25T10:10:00Z",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useMutateCompleteAdoption", () => {
  describe("loading state", () => {
    it("isPending is true while mutation is in-flight", async () => {
      let resolveRequest!: () => void;
      const requestInflight = new Promise<void>((res) => {
        resolveRequest = res;
      });

      server.use(
        http.post("/api/adoption/:id/complete", async () => {
          await requestInflight;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useMutateCompleteAdoption("adoption-1"),
        { wrapper },
      );

      act(() => {
        result.current.mutateCompleteAdoption();
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
        expect(result.current.isError).toBe(false);
      });

      resolveRequest();
      await waitFor(() => expect(result.current.isPending).toBe(false));
    });
  });

  describe("success state", () => {
    it("isError is false and isPending becomes false on success", async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useMutateCompleteAdoption("adoption-1"),
        { wrapper },
      );

      act(() => {
        result.current.mutateCompleteAdoption();
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("completes successfully with no error", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData<AdoptionDetails>(["adoption", "adoption-1"], MOCK_ADOPTION);

      const { result } = renderHook(
        () => useMutateCompleteAdoption("adoption-1"),
        { wrapper },
      );

      await act(async () => {
        result.current.mutateCompleteAdoption();
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("error state", () => {
    it("isError is true and isPending becomes false when server returns 500", async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useMutateCompleteAdoption("fail"),
        { wrapper },
      );

      act(() => {
        result.current.mutateCompleteAdoption();
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
  });

  describe("optimistic update", () => {
    it("applies optimistic update (SETTLEMENT_TRIGGERED) before server responds", async () => {
      let resolveRequest!: () => void;
      const requestInflight = new Promise<void>((res) => {
        resolveRequest = res;
      });

      server.use(
        http.post("/api/adoption/:id/complete", async () => {
          await requestInflight;
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData<AdoptionDetails>(["adoption", "adoption-1"], MOCK_ADOPTION);

      const { result } = renderHook(
        () => useMutateCompleteAdoption("adoption-1"),
        { wrapper },
      );

      act(() => {
        result.current.mutateCompleteAdoption();
      });

      // While in-flight: cache should reflect optimistic SETTLEMENT_TRIGGERED status
      await waitFor(() => {
        const optimisticData = queryClient.getQueryData<AdoptionDetails>([
          "adoption",
          "adoption-1",
        ]);
        expect(optimisticData?.status).toBe("SETTLEMENT_TRIGGERED");
      });

      resolveRequest();
      await waitFor(() => expect(result.current.isPending).toBe(false));
    });
  });

  describe("rollback on error", () => {
    it("restores previous cache state when mutation fails", async () => {
      const { queryClient, wrapper } = createWrapper();
      // Seed cache with the original adoption state
      queryClient.setQueryData<AdoptionDetails>(["adoption", "fail"], MOCK_ADOPTION);

      const { result } = renderHook(
        () => useMutateCompleteAdoption("fail"),
        { wrapper },
      );

      act(() => {
        result.current.mutateCompleteAdoption();
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // After failure, cache should be restored to original state
      const restoredData = queryClient.getQueryData<AdoptionDetails>([
        "adoption",
        "fail",
      ]);
      expect(restoredData?.status).toBe("ESCROW_FUNDED");
      expect(restoredData?.id).toBe("adoption-1");
    });

    it("clears optimistic update and shows error state on failure", async () => {
      const { queryClient, wrapper } = createWrapper();
      queryClient.setQueryData<AdoptionDetails>(["adoption", "fail"], MOCK_ADOPTION);

      const { result } = renderHook(
        () => useMutateCompleteAdoption("fail"),
        { wrapper },
      );

      act(() => {
        result.current.mutateCompleteAdoption();
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Error state should be set correctly
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.error).not.toBeNull();
    });
  });
});
