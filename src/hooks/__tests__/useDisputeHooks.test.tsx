import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import toast from "react-hot-toast";
import { useMutateRaiseDispute } from "../useMutateRaiseDispute";



vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe("Dispute Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMutateRaiseDispute", () => {
    it("calls POST /disputes and triggers success toast", async () => {
      const { wrapper } = createWrapper();
      
      let requestedUrl = "";
      let requestedMethod = "";
      server.use(
        http.post(/\/disputes/, ({ request }) => {
          requestedUrl = request.url;
          requestedMethod = request.method;
          return HttpResponse.json({ adoptionId: "adoption-123" });
        })
      );

      const { result } = renderHook(() => useMutateRaiseDispute(), { wrapper });

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
  });
});