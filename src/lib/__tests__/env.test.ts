import { describe, expect, it } from "vitest";
import { loadEnv } from "../env";

describe("loadEnv", () => {
	it("accepts a missing VITE_API_URL, which the API client defaults", () => {
		expect(loadEnv({}).VITE_API_URL).toBeUndefined();
	});

	it("accepts an app-relative VITE_API_URL", () => {
		expect(loadEnv({ VITE_API_URL: "/api" }).VITE_API_URL).toBe("/api");
	});

	it("names each invalid variable", () => {
		expect(() =>
			loadEnv({
				VITE_API_URL: "not-a-url",
				VITE_MSW: "yes",
				VITE_ENABLE_ANALYTICS: "1",
				VITE_REALTIME_URL: "ws-bad",
			}),
		).toThrow(/VITE_API_URL[\s\S]*VITE_MSW[\s\S]*VITE_ENABLE_ANALYTICS[\s\S]*VITE_REALTIME_URL/);
	});

	it("accepts a documented environment", () => {
		expect(
			loadEnv({
				VITE_API_URL: "http://localhost:3000/api",
				VITE_MSW: "false",
				VITE_ENABLE_ANALYTICS: "true",
				VITE_REALTIME_URL: "wss://example.com/realtime",
				VITE_STELLAR_NETWORK: "testnet",
			}).VITE_API_URL,
		).toBe("http://localhost:3000/api");
	});
});
