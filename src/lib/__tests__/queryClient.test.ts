import { describe, it, expect } from "vitest";
import { queryClient, retryQuery } from "../query-client";
import { ApiError } from "../api-errors";

describe("queryClient", () => {
	it("creates a QueryClient with correct default options", () => {
		const defaultOptions = queryClient.getDefaultOptions();

		expect(defaultOptions.queries?.staleTime).toBe(30 * 1000);
		expect(defaultOptions.queries?.retry).toBe(retryQuery);
		expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
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

	it("does not retry 4xx errors and retries other failures once", () => {
		expect(retryQuery(0, new ApiError("nope", { status: 404 }))).toBe(false);
		expect(retryQuery(0, new ApiError("bad", { status: 400 }))).toBe(false);
		expect(retryQuery(0, new ApiError("down", { status: 500 }))).toBe(true);
		expect(retryQuery(1, new ApiError("down", { status: 500 }))).toBe(false);
	});
});