import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { setupServer } from "msw/node";
import {
  escrowStatusHandler,
  setEscrowStatus,
} from "../../../test/msw/handlers";
import { useEscrowStatus } from "../useEscrowStatus";

const server = setupServer(escrowStatusHandler);

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

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("useEscrowStatus", () => {
  it("stops polling when status is SETTLED", async () => {
    const queryClient = createTestQueryClient();
    setEscrowStatus("SETTLED");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderHook(() => useEscrowStatus("escrow-1", { intervalMs: 50 }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    const callCount = fetchSpy.mock.calls.length;
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 200));
		});
    expect(fetchSpy).toHaveBeenCalledTimes(callCount);
  });

  it("continues polling when status is FUNDED", async () => {
    const queryClient = createTestQueryClient();
    setEscrowStatus("FUNDED");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderHook(() => useEscrowStatus("escrow-2", { intervalMs: 50 }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2), {
      timeout: 300,
    });
  });
});
