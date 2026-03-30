import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEscrowStatus } from "../useEscrowStatus";
import { apiClient } from "../../api-client";

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

describe("useEscrowStatus", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("marks the query as settled when status is SETTLED", async () => {
		const queryClient = createTestQueryClient();
		const fetchSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
			status: "SETTLED",
			balance: "100",
		});

		const { result } = renderHook(() => useEscrowStatus("escrow-1"), {
			wrapper: createWrapper(queryClient),
		});

		await waitFor(() => {
			expect(fetchSpy).toHaveBeenCalled();
			expect(result.current.data?.status).toBe("SETTLED");
		});

		// Wait to ensure polling does NOT happen
		await new Promise((resolve) => setTimeout(resolve, 500));
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("continues polling when status is PENDING", async () => {
		const queryClient = createTestQueryClient();
		let callCount = 0;
		const fetchSpy = vi.spyOn(apiClient, "get").mockImplementation(async () => {
			callCount++;
			if (callCount === 1) {
				return { status: "PENDING", balance: "100" };
			}
			return { status: "SETTLED", balance: "100" };
		});

		renderHook(() => useEscrowStatus("escrow-2", { intervalMs: 100 }), {
			wrapper: createWrapper(queryClient),
		});

		// Should have called at least twice
		await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2), {
			timeout: 1000,
		});

		expect(fetchSpy.mock.calls[0][0]).toContain("/escrow/escrow-2/status");
	});

	it("pauses polling when tab is hidden", async () => {
		const queryClient = createTestQueryClient();
		const fetchSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
			status: "PENDING",
			balance: "100",
		});

		// Mock document.hidden
		Object.defineProperty(document, "hidden", {
			writable: true,
			configurable: true,
			value: false,
		});

		renderHook(
			() =>
				useEscrowStatus("escrow-3", {
					intervalMs: 100,
					pauseOnHidden: true,
				}),
			{ wrapper: createWrapper(queryClient) },
		);

		// Initial fetch
		await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

		// Hide the tab
		await act(async () => {
			Object.defineProperty(document, "hidden", { value: true });
			document.dispatchEvent(new Event("visibilitychange"));
		});

		const callCountBeforeHidden = fetchSpy.mock.calls.length;

		// Wait a bit - should NOT poll while hidden
		await new Promise((resolve) => setTimeout(resolve, 300));
		expect(fetchSpy).toHaveBeenCalledTimes(callCountBeforeHidden);

		// Show the tab again
		await act(async () => {
			Object.defineProperty(document, "hidden", { value: false });
			document.dispatchEvent(new Event("visibilitychange"));
		});

		// Should resume polling
		await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(callCountBeforeHidden + 1), {
			timeout: 1000,
		});
	});
});
