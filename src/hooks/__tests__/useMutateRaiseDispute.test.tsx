import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { useMutateRaiseDispute } from "../useMutateRaiseDispute";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useMutateRaiseDispute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /api/disputes and triggers success toast", async () => {
    let requestedUrl = "";
    let requestedMethod = "";

    server.use(
      http.post(/\/disputes/, ({ request }) => {
        requestedUrl = request.url;
        requestedMethod = request.method;
        return HttpResponse.json({ adoptionId: "adoption-123" });
      }),
    );

    const { result } = renderHook(() => useMutateRaiseDispute(), {
      wrapper: createWrapper(),
    });

    let responseData: any;
    await act(async () => {
      responseData = await result.current.mutateAsync({
        adoptionId: "adoption-123",
        raisedBy: "user-buyer-1",
        reason: "delayed_handover",
      });
    });

    expect(result.current.isError).toBe(false);
    expect(toast.success).toHaveBeenCalled();
    expect(responseData?.adoptionId).toBe("adoption-123");
    expect(requestedMethod).toBe("POST");
    expect(requestedUrl).toMatch(/\/disputes$/);
  });

  it("shows error toast on mutation failure", async () => {
    server.use(
      http.post(/\/disputes/, () => {
        return HttpResponse.json({ message: "Validation failed" }, { status: 422 });
      }),
    );

    const { result } = renderHook(() => useMutateRaiseDispute(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          adoptionId: "adoption-123",
          raisedBy: "user-buyer-1",
          reason: "invalid",
        });
      } catch {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it("accepts files in the payload for FormData upload path", async () => {
    let receivedContentType = "";

    server.use(
      http.post(/\/disputes/, ({ request }) => {
        receivedContentType = request.headers.get("content-type") ?? "";
        return HttpResponse.json({ adoptionId: "adoption-789" });
      }),
    );

    const { result } = renderHook(() => useMutateRaiseDispute(), {
      wrapper: createWrapper(),
    });

    const testFile = new File(["test content"], "evidence.pdf", {
      type: "application/pdf",
    });

    await act(async () => {
      await result.current.mutateAsync({
        adoptionId: "adoption-789",
        raisedBy: "user-3",
        reason: "test with file",
        files: [testFile],
      });
    });

    expect(result.current.isError).toBe(false);
    expect(receivedContentType).toContain("multipart/form-data");
  });

  it("returns error with status code on HTTP failure", async () => {
    server.use(
      http.post(/\/disputes/, () => {
        return HttpResponse.json({ message: "Server error" }, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useMutateRaiseDispute(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          adoptionId: "adoption-999",
          raisedBy: "user-5",
          reason: "server error test",
        });
      } catch {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });
  });

  it("clears error state on successful retry", async () => {
    let callCount = 0;

    server.use(
      http.post(/\/disputes/, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ message: "Temporary error" }, { status: 503 });
        }
        return HttpResponse.json({ adoptionId: "adoption-retry" });
      }),
    );

    const { result } = renderHook(() => useMutateRaiseDispute(), {
      wrapper: createWrapper(),
    });

    // First call fails
    await act(async () => {
      try {
        await result.current.mutateAsync({
          adoptionId: "adoption-retry",
          raisedBy: "user-6",
          reason: "retry test",
        });
      } catch {
        // Expected
      }
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Second call succeeds
    await act(async () => {
      await result.current.mutateAsync({
        adoptionId: "adoption-retry",
        raisedBy: "user-6",
        reason: "retry test",
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(false);
    });
  });
});
