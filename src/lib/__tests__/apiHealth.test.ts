import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	FAILURE_THRESHOLD,
	FAILURE_WINDOW_MS,
	getApiHealthSnapshot,
	reportApiFailure,
	reportApiSuccess,
	resetApiHealth,
	subscribeApiHealth,
} from "../apiHealth";

describe("apiHealth", () => {
	beforeEach(() => {
		resetApiHealth();
	});

	it("stays healthy after a single failure", () => {
		reportApiFailure();
		expect(getApiHealthSnapshot().isDegraded).toBe(false);
	});

	it("degrades only after the failure threshold is reached", () => {
		for (let index = 0; index < FAILURE_THRESHOLD - 1; index++) {
			reportApiFailure();
		}
		expect(getApiHealthSnapshot().isDegraded).toBe(false);

		reportApiFailure();
		expect(getApiHealthSnapshot().isDegraded).toBe(true);
	});

	it("counts only failures inside the sliding window", () => {
		const start = 1_000_000;
		reportApiFailure(start);
		reportApiFailure(start + 1_000);
		// The first two have aged out of the 30s window.
		reportApiFailure(start + FAILURE_WINDOW_MS + 2_000);

		expect(getApiHealthSnapshot().isDegraded).toBe(false);
	});

	it("hides the banner on the next successful request", () => {
		for (let index = 0; index < FAILURE_THRESHOLD; index++) {
			reportApiFailure();
		}
		expect(getApiHealthSnapshot().isDegraded).toBe(true);

		reportApiSuccess();
		expect(getApiHealthSnapshot().isDegraded).toBe(false);
	});

	it("clears the failure window on success", () => {
		reportApiFailure();
		reportApiFailure();
		reportApiSuccess();
		reportApiFailure();

		expect(getApiHealthSnapshot().isDegraded).toBe(false);
	});

	it("notifies subscribers only when the degraded state changes", () => {
		const listener = vi.fn();
		const unsubscribe = subscribeApiHealth(listener);

		reportApiFailure();
		expect(listener).not.toHaveBeenCalled();

		reportApiFailure();
		reportApiFailure();
		expect(listener).toHaveBeenCalledTimes(1);

		reportApiFailure();
		expect(listener).toHaveBeenCalledTimes(1);

		reportApiSuccess();
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
		reportApiFailure();
		reportApiFailure();
		reportApiFailure();
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("resetApiHealth clears the failure history and degraded mode", () => {
		for (let index = 0; index < FAILURE_THRESHOLD; index++) {
			reportApiFailure();
		}
		resetApiHealth();

		expect(getApiHealthSnapshot().isDegraded).toBe(false);
	});
});
