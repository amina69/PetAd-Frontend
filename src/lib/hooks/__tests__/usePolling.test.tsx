import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePolling } from "../usePolling";
import type { ReactNode } from "react";

// Helper to create a fresh QueryClient for each test
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

// Wrapper component for React Query
function createWrapper(queryClient: QueryClient) {
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("usePolling", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("polls at the specified interval", async () => {
		const queryClient = createTestQueryClient();
		const fetchFn = vi.fn().mockResolvedValue({ status: "pending" });

		renderHook(
			() =>
				usePolling(["test-query"], fetchFn, {
					intervalMs: 100,
				}),
			{ wrapper: createWrapper(queryClient) },
		);

		// Initial fetch
		await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

		// Wait for polling to occur
		await waitFor(
			() => expect(fetchFn).toHaveBeenCalledTimes(2),
			{ timeout: 300 },
		);

		await waitFor(
			() => expect(fetchFn).toHaveBeenCalledTimes(3),
			{ timeout: 300 },
		);
	});

	it("pauses polling when tab is hidden", async () => {
		const queryClient = createTestQueryClient();
		const fetchFn = vi.fn().mockResolvedValue({ status: "pending" });

		// Mock document.hidden
		Object.defineProperty(document, "hidden", {
			writable: true,
			configurable: true,
			value: false,
		});

		renderHook(
			() =>
				usePolling(["test-query-hidden"], fetchFn, {
					intervalMs: 100,
					pauseOnHidden: true,
				}),
			{ wrapper: createWrapper(queryClient) },
		);

		// Initial fetch
		await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

		// Hide the tab
		await act(async () => {
			Object.defineProperty(document, "hidden", { value: true });
			document.dispatchEvent(new Event("visibilitychange"));
		});

		const callCountBeforeHidden = fetchFn.mock.calls.length;

		// Wait a bit - should NOT poll while hidden
		await new Promise((resolve) => setTimeout(resolve, 250));
		
		// Should not have polled while hidden
		expect(fetchFn).toHaveBeenCalledTimes(callCountBeforeHidden);

		// Show the tab again
		await act(async () => {
			Object.defineProperty(document, "hidden", { value: false });
			document.dispatchEvent(new Event("visibilitychange"));
		});

		// Should resume polling
		await waitFor(
			() => expect(fetchFn).toHaveBeenCalledTimes(callCountBeforeHidden + 1),
			{ timeout: 300 },
		);
	});

	it("stops polling when stopWhen condition is met", async () => {
		const queryClient = createTestQueryClient();
		let callCount = 0;
		const fetchFn = vi.fn().mockImplementation(() => {
			callCount++;
			return Promise.resolve({
				status: callCount >= 2 ? "completed" : "pending",
			});
		});

		renderHook(
			() =>
				usePolling(["test-query-stop"], fetchFn, {
					intervalMs: 100,
					stopWhen: (data) => data?.status === "completed",
				}),
			{ wrapper: createWrapper(queryClient) },
		);

		// Initial fetch
		await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

		// Poll until condition is met
		await waitFor(
			() => expect(fetchFn).toHaveBeenCalledTimes(2),
			{ timeout: 300 },
		);

		const finalCallCount = fetchFn.mock.calls.length;

		// Wait to ensure polling has stopped
		await new Promise((resolve) => setTimeout(resolve, 250));
		
		// Should not have polled again after terminal condition
		expect(fetchFn).toHaveBeenCalledTimes(finalCallCount);
	});

	it("does not pause on hidden when pauseOnHidden is false", async () => {
		const queryClient = createTestQueryClient();
		const fetchFn = vi.fn().mockResolvedValue({ status: "pending" });

		Object.defineProperty(document, "hidden", {
			writable: true,
			configurable: true,
			value: false,
		});

		renderHook(
			() =>
				usePolling(["test-query-no-pause"], fetchFn, {
					intervalMs: 100,
					pauseOnHidden: false,
				}),
			{ wrapper: createWrapper(queryClient) },
		);

		await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

		// Hide the tab
		await act(async () => {
			Object.defineProperty(document, "hidden", { value: true });
			document.dispatchEvent(new Event("visibilitychange"));
		});

		// Should continue polling even when hidden
		await waitFor(
			() => expect(fetchFn).toHaveBeenCalledTimes(2),
			{ timeout: 300 },
		);
	});

	it("cleans up visibilitychange listener on unmount", async () => {
		const queryClient = createTestQueryClient();
		const fetchFn = vi.fn().mockResolvedValue({ status: "pending" });
		const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

		const { unmount } = renderHook(
			() =>
				usePolling(["test-query-cleanup"], fetchFn, {
					intervalMs: 100,
					pauseOnHidden: true,
				}),
			{ wrapper: createWrapper(queryClient) },
		);

		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"visibilitychange",
			expect.any(Function),
		);
	});

	it("respects enabled option", async () => {
		const queryClient = createTestQueryClient();
		const fetchFn = vi.fn().mockResolvedValue({ status: "pending" });

		renderHook(
			() =>
				usePolling(["test-query-disabled"], fetchFn, {
					intervalMs: 100,
					enabled: false,
				}),
			{ wrapper: createWrapper(queryClient) },
		);

		// Wait a bit to ensure no fetch happens
		await new Promise((resolve) => setTimeout(resolve, 250));
		
		// Should not fetch when disabled
		expect(fetchFn).not.toHaveBeenCalled();
	});
});
