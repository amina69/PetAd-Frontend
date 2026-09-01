import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { useDisputes } from "../useDisputes";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockDisputes = [
  {
    id: "d-1",
    adoptionId: "a-1",
    raisedBy: "user-1",
    reason: "misrepresentation",
    description: "Health issue not disclosed",
    status: "open",
    isOverdue: false,
    pet: { id: "pet-1", name: "Max" },
    adopter: { id: "user-1", name: "Alice" },
    shelter: { id: "shelter-1", name: "Happy Paws" },
    evidence: [],
    timeline: [],
    resolution: null,
    createdAt: "2026-03-24T10:00:00.000Z",
    updatedAt: "2026-03-24T10:00:00.000Z",
  },
  {
    id: "d-2",
    adoptionId: "a-2",
    raisedBy: "user-2",
    reason: "delayed_handover",
    description: "Handover was late",
    status: "under_review",
    isOverdue: true,
    pet: { id: "pet-2", name: "Bella" },
    adopter: { id: "user-2", name: "Bob" },
    shelter: { id: "shelter-2", name: "Rescue Dogs" },
    evidence: [],
    timeline: [],
    resolution: null,
    createdAt: "2026-03-25T10:00:00.000Z",
    updatedAt: "2026-03-25T10:00:00.000Z",
  },
];

describe("useDisputes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches disputes and returns them in the disputes array", async () => {
    server.use(
      http.get("/api/disputes", () => {
        return HttpResponse.json({ data: mockDisputes });
      }),
    );

    const { result } = renderHook(() => useDisputes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.disputes).toHaveLength(2);
    expect(result.current.disputes[0].id).toBe("d-1");
    expect(result.current.disputes[1].id).toBe("d-2");
  });

  it("passes status filter as query parameter", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/disputes", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [] });
      }),
    );

    const { result } = renderHook(() => useDisputes({ status: "open" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(capturedUrl).toContain("status=open");
  });

  it("does not pass status param when status is 'all'", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/disputes", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [] });
      }),
    );

    const { result } = renderHook(() => useDisputes({ status: "all" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(capturedUrl).not.toContain("status=");
  });

  it("passes overdue filter as query parameter", async () => {
    let capturedUrl = "";
    server.use(
      http.get("/api/disputes", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: [] });
      }),
    );

    const { result } = renderHook(() => useDisputes({ overdue: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(capturedUrl).toContain("overdue=true");
  });

  it("returns empty disputes array when API returns empty data", async () => {
    server.use(
      http.get("/api/disputes", () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    const { result } = renderHook(() => useDisputes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.disputes).toHaveLength(0);
  });

  it("sets isError to true when API returns error", async () => {
    server.use(
      http.get("/api/disputes", () => {
        return HttpResponse.json({ message: "Server error" }, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useDisputes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("exposes isLoadingMore from isFetchingNextPage", async () => {
    server.use(
      http.get("/api/disputes", () => {
        return HttpResponse.json({ data: mockDisputes });
      }),
    );

    const { result } = renderHook(() => useDisputes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // isLoadingMore should be a boolean (false when not fetching next page)
    expect(typeof result.current.isLoadingMore).toBe("boolean");
  });
});
