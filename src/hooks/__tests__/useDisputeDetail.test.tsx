import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import React from "react";
import { useDisputeDetail } from "../useDisputeDetail";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useDisputeDetail", () => {
  it("returns correct shape for an OPEN dispute", async () => {
    const { result } = renderHook(() => useDisputeDetail("dispute-001"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);

    const data = result.current.data!;
    expect(data.status).toBe("open");
    expect(data.escrowOnChainStatus).toBe("HELD");
    expect(data.stellarExplorerUrl).toContain("stellar.expert");
    expect(data.resolutionTxHash).toBeNull();
  });

  it("returns correct shape for a RESOLVED dispute", async () => {
    const { result } = renderHook(() => useDisputeDetail("dispute-002"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);

    const data = result.current.data!;
    expect(data.status).toBe("resolved");
    expect(data.escrowOnChainStatus).toBe("RELEASED");
    expect(data.resolutionTxHash).toBe("abc123def456789");
  });

  it("isNotFound is true on 404", async () => {
    server.use(
      http.get("/api/disputes/bad-id", () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useDisputeDetail("bad-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isNotFound).toBe(true);
  });
});
