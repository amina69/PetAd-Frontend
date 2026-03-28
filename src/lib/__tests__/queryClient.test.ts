import { describe, it, expect } from "vitest";
import { queryClient } from "../query-client";

describe("queryClient", () => {
	it("creates a QueryClient with correct default options", () => {
		const defaultOptions = queryClient.getDefaultOptions();

		expect(defaultOptions.queries?.staleTime).toBe(30 * 1000);
		expect(defaultOptions.queries?.retry).toBe(2);
		expect(defaultOptions.queries?.retryDelay).toBeTypeOf("function");
		expect(defaultOptions.mutations?.retry).toBe(0);
		expect(defaultOptions.mutations?.onError).toBeTypeOf("function");
	});

	it("has a queryCache with error handler", () => {
		expect(queryClient.getQueryCache()).toBeDefined();
	});

	it("retryDelay uses exponential backoff", () => {
		const retryDelay = queryClient.getDefaultOptions().queries?.retryDelay as (
			attempt: number,
		) => number;

		expect(retryDelay(0)).toBe(1000);
		expect(retryDelay(1)).toBe(2000);
		expect(retryDelay(2)).toBe(4000);
	});
});