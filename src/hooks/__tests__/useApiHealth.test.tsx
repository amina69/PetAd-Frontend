import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApiHealth } from "../useApiHealth";
import {
	FAILURE_THRESHOLD,
	reportApiFailure,
	reportApiSuccess,
	resetApiHealth,
} from "../../lib/apiHealth";

describe("useApiHealth", () => {
	beforeEach(() => {
		resetApiHealth();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("starts healthy", () => {
		const { result } = renderHook(() => useApiHealth());
		expect(result.current.isDegraded).toBe(false);
	});

	it("flips to degraded after repeated failures and back on success", () => {
		const { result } = renderHook(() => useApiHealth());

		act(() => {
			for (let index = 0; index < FAILURE_THRESHOLD; index++) {
				reportApiFailure();
			}
		});

		expect(result.current.isDegraded).toBe(true);

		act(() => {
			reportApiSuccess();
		});

		expect(result.current.isDegraded).toBe(false);
	});

	it("exposes the optional status page URL", () => {
		vi.stubEnv("VITE_STATUS_PAGE_URL", "https://status.example.com");

		const { result } = renderHook(() => useApiHealth());
		expect(result.current.statusPageUrl).toBe("https://status.example.com");
	});

	it("omits the status page URL when unset", () => {
		vi.stubEnv("VITE_STATUS_PAGE_URL", "");

		const { result } = renderHook(() => useApiHealth());
		expect(result.current.statusPageUrl).toBeUndefined();
	});
});
