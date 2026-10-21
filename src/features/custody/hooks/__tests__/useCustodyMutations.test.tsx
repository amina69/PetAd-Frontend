import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor, screen } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import { custodyKeys } from "../useCustodyList";
import { useRequestCustody } from "../useRequestCustody";
import { useExtendCustody } from "../useExtendCustody";
import { useEndCustody } from "../useEndCustody";
import type { CustodyArrangement } from "../../types/custody";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CREATED_ARRANGEMENT: CustodyArrangement = {
  id: "custody-42",
  petId: "pet-1",
  ownerId: "user-1",
  caretakerId: "user-2",
  startDate: "2026-06-20",
  endDate: "2026-06-27",
  status: "requested",
  notes: null,
  escrowStatus: null,
  escrowId: null,
};

const ARRANGEMENT: CustodyArrangement = {
  ...CREATED_ARRANGEMENT,
  status: "active",
  escrowStatus: "FUNDED",
  escrowId: "escrow-1",
};

/** A valid request payload for the frozen "today" (15 June 2026). */
const REQUEST_PAYLOAD = {
  petId: "pet-1",
  caretakerId: "user-2",
  startDate: "2026-06-20",
  endDate: "2026-06-27",
};

/** Cache entries that must never be touched by a custody mutation. */
const UNRELATED_KEYS: QueryKey[] = [
  ["custody-detail", "custody-99"],
  ["escrow-status", "escrow-1"],
  ["disputes"],
  ["adoption", "adoption-1"],
];

/** Cache entries holding the custody lists. */
const LIST_KEYS: QueryKey[] = [
  custodyKeys.list({ page: 1 }),
  custodyKeys.list({ status: "active" }),
];

const INITIAL_PATH = "/custody";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[INITIAL_PATH]}>
        <Routes>
          <Route
            path="/custody"
            element={<div data-testid="custody-dashboard-route" />}
          />
          <Route
            path="/custody/:custodyId/timeline"
            element={<div data-testid="custody-timeline-route" />}
          />
        </Routes>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { queryClient, wrapper };
}

/** Seeds the cache with the entries a custody mutation may invalidate. */
function seedCache(queryClient: QueryClient) {
  LIST_KEYS.forEach((key) => {
    queryClient.setQueryData(key, { data: [], total: 0, page: 1, limit: 20 });
  });

  queryClient.setQueryData(custodyKeys.detail("custody-42"), ARRANGEMENT);
  queryClient.setQueryData(custodyKeys.detail("custody-99"), ARRANGEMENT);

  UNRELATED_KEYS.forEach((key) => {
    queryClient.setQueryData(key, { untouched: true });
  });
}

/** The query keys that were invalidated by the last mutation. */
function invalidatedKeys(queryClient: QueryClient): QueryKey[] {
  return queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => query.state.isInvalidated)
    .map((query) => query.queryKey);
}

function expectInvalidated(queryClient: QueryClient, key: QueryKey) {
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
}

function expectUntouched(queryClient: QueryClient, key: QueryKey) {
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("custody mutations", () => {
  beforeEach(() => {
    // Freeze "today" so the request payload never falls foul of the
    // "start date cannot be in the past" rule.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 5, 15, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useRequestCustody", () => {
    it("invalidates the lists and the created arrangement, and nothing else", async () => {
      server.use(
        http.post("*/api/custody", () =>
          HttpResponse.json(CREATED_ARRANGEMENT, { status: 201 }),
        ),
      );

      const { queryClient, wrapper } = createWrapper();
      seedCache(queryClient);

      const { result } = renderHook(() => useRequestCustody(), { wrapper });

      act(() => {
        result.current.requestCustody(REQUEST_PAYLOAD);
      });

      await waitFor(() =>
        expect(invalidatedKeys(queryClient)).toHaveLength(3),
      );

      // The list(s)…
      LIST_KEYS.forEach((key) => expectInvalidated(queryClient, key));
      // …and the arrangement that was just created.
      expectInvalidated(queryClient, custodyKeys.detail("custody-42"));

      // Other arrangements, escrow caches and unrelated domains are untouched.
      UNRELATED_KEYS.forEach((key) => expectUntouched(queryClient, key));
    });

    it("navigates to the new arrangement", async () => {
      server.use(
        http.post("*/api/custody", () =>
          HttpResponse.json(CREATED_ARRANGEMENT, { status: 201 }),
        ),
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useRequestCustody(), { wrapper });

      act(() => {
        result.current.requestCustody(REQUEST_PAYLOAD);
      });

      await waitFor(() =>
        expect(
          screen.getByTestId("custody-timeline-route"),
        ).toBeInTheDocument(),
      );
    });

    it("does not invalidate anything when the request fails", async () => {
      server.use(
        http.post("*/api/custody", () =>
          HttpResponse.json(
            { message: "Dates overlap an existing custody" },
            { status: 409 },
          ),
        ),
      );

      const { queryClient, wrapper } = createWrapper();
      seedCache(queryClient);

      const { result } = renderHook(() => useRequestCustody(), { wrapper });

      act(() => {
        result.current.requestCustody(REQUEST_PAYLOAD);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(invalidatedKeys(queryClient)).toHaveLength(0);
      expect(screen.getByTestId("custody-dashboard-route")).toBeInTheDocument();
      expect(screen.queryByTestId("custody-timeline-route")).toBeNull();
    });
  });

  describe("useExtendCustody", () => {
    it("invalidates the lists and the extended arrangement, and nothing else", async () => {
      server.use(
        http.patch("*/api/custody/:id/extend", () =>
          HttpResponse.json({ ...ARRANGEMENT, endDate: "2026-07-04" }),
        ),
      );

      const { queryClient, wrapper } = createWrapper();
      seedCache(queryClient);

      const { result } = renderHook(() => useExtendCustody("custody-42"), {
        wrapper,
      });

      act(() => {
        result.current.extendCustody({ endDate: "2026-07-04" });
      });

      await waitFor(() =>
        expect(invalidatedKeys(queryClient)).toHaveLength(3),
      );

      LIST_KEYS.forEach((key) => expectInvalidated(queryClient, key));
      expectInvalidated(queryClient, custodyKeys.detail("custody-42"));

      UNRELATED_KEYS.forEach((key) => expectUntouched(queryClient, key));
    });
  });

  describe("useEndCustody", () => {
    it("invalidates the lists and the ended arrangement, and nothing else", async () => {
      server.use(
        http.post("*/api/custody/:id/end", () =>
          HttpResponse.json({ ...ARRANGEMENT, status: "completed" }),
        ),
      );

      const { queryClient, wrapper } = createWrapper();
      seedCache(queryClient);

      const { result } = renderHook(() => useEndCustody("custody-42"), {
        wrapper,
      });

      act(() => {
        result.current.endCustody();
      });

      await waitFor(() =>
        expect(invalidatedKeys(queryClient)).toHaveLength(3),
      );

      LIST_KEYS.forEach((key) => expectInvalidated(queryClient, key));
      expectInvalidated(queryClient, custodyKeys.detail("custody-42"));

      UNRELATED_KEYS.forEach((key) => expectUntouched(queryClient, key));
    });
  });
});
