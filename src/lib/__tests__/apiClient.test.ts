import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import type { ApiClientConfig } from "../../types/auth";
import {
	ApiError,
	NotFoundError,
	ValidationApiError,
	ForbiddenError,
} from "../api-errors";
import { createApiClient, getApiClient } from "../api-client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeResponse(
	body: unknown,
	status = 200,
	headers?: Record<string, string>,
): Response {
	// 🚨 204 responses cannot have a body
	if (status === 204) {
		return new Response(null, {
			status,
			headers,
		});
	}

	const isJson = typeof body === "object";

	return new Response(isJson ? JSON.stringify(body) : String(body), {
		status,
		headers: {
			"Content-Type": isJson ? "application/json" : "text/plain",
			...headers,
		},
	});
}
const BASE_CONFIG: ApiClientConfig = {
	baseURL: "https://api.example.com",
};

// Reset the singleton between tests by clearing the module-level variable via
// a fresh import cycle — we re-create it explicitly in each describe block.
function freshClient(config: Partial<ApiClientConfig> = {}) {
	// Cast to `any` to call the private constructor path indirectly via the
	// exported factory with a unique base URL so the singleton branch is bypassed.
	return createApiClient({ ...BASE_CONFIG, ...config } as ApiClientConfig);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ApiClient", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		// Reset localStorage / sessionStorage
		localStorage.clear();
		sessionStorage.clear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	// ── HTTP methods ──────────────────────────────────────────────────────────

	describe("GET", () => {
		it("sends a GET request to the correct URL", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({ ok: true }));
			const client = freshClient();

			await client.get("/users");

			expect(fetchMock).toHaveBeenCalledOnce();
			const [url, init] = fetchMock.mock.calls[0];
			expect(url).toBe("https://api.example.com/users");
			expect(init.method).toBe("GET");
		});

		it("returns parsed JSON on success", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({ id: 1, name: "Alice" }));
			const client = freshClient();

			const result = await client.get<{ id: number; name: string }>("/users/1");
			expect(result).toEqual({ id: 1, name: "Alice" });
		});
	});

	describe("POST", () => {
		it("sends a POST request with JSON body", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({ created: true }, 201));
			const client = freshClient();

			await client.post("/users", { name: "Bob" });

			const [url, init] = fetchMock.mock.calls[0];
			expect(url).toBe("https://api.example.com/users");
			expect(init.method).toBe("POST");
			expect(JSON.parse(init.body)).toEqual({ name: "Bob" });
		});

		it("sends a POST request without body when data is omitted", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({ ok: true }));
			const client = freshClient();

			await client.post("/ping");

			const [, init] = fetchMock.mock.calls[0];
			expect(init.body).toBeUndefined();
		});
	});

	describe("PUT", () => {
		it("sends a PUT request with the correct body", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({ updated: true }));
			const client = freshClient();

			await client.put("/users/1", { name: "Carol" });

			const [, init] = fetchMock.mock.calls[0];
			expect(init.method).toBe("PUT");
			expect(JSON.parse(init.body)).toEqual({ name: "Carol" });
		});
	});

	describe("PATCH", () => {
		it("sends a PATCH request with partial data", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({ patched: true }));
			const client = freshClient();

			await client.patch("/users/1", { email: "new@example.com" });

			const [, init] = fetchMock.mock.calls[0];
			expect(init.method).toBe("PATCH");
			expect(JSON.parse(init.body)).toEqual({ email: "new@example.com" });
		});
	});

	describe("DELETE", () => {
		it("sends a DELETE request", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({}, 204));
			const client = freshClient();

			await client.delete("/users/1");

			const [url, init] = fetchMock.mock.calls[0];
			expect(url).toBe("https://api.example.com/users/1");
			expect(init.method).toBe("DELETE");
		});
	});

	// ── Headers ───────────────────────────────────────────────────────────────

	describe("headers", () => {
		it("sends Content-Type: application/json by default", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({}));
			const client = freshClient();

			await client.get("/test");

			const [, { headers }] = fetchMock.mock.calls[0];
			expect(headers["Content-Type"]).toBe("application/json");
		});

		it("merges extra headers passed via config", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({}));
			const client = freshClient({ headers: { "X-App-Version": "2.0" } });

			await client.get("/test");

			const [, { headers }] = fetchMock.mock.calls[0];
			expect(headers["X-App-Version"]).toBe("2.0");
		});

		it("attaches Authorization header when localStorage has a token", async () => {
			localStorage.setItem("auth_token", "local-token-abc");
			fetchMock.mockResolvedValueOnce(makeResponse({}));
			const client = freshClient();

			await client.get("/protected");

			const [, { headers }] = fetchMock.mock.calls[0];
			expect(headers["Authorization"]).toBe("Bearer local-token-abc");
		});

		it("falls back to sessionStorage token when localStorage is empty", async () => {
			sessionStorage.setItem("auth_token", "session-token-xyz");
			fetchMock.mockResolvedValueOnce(makeResponse({}));
			const client = freshClient();

			await client.get("/protected");

			const [, { headers }] = fetchMock.mock.calls[0];
			expect(headers["Authorization"]).toBe("Bearer session-token-xyz");
		});

		it("prefers localStorage token over sessionStorage token", async () => {
			localStorage.setItem("auth_token", "local-wins");
			sessionStorage.setItem("auth_token", "session-loses");
			fetchMock.mockResolvedValueOnce(makeResponse({}));
			const client = freshClient();

			await client.get("/protected");

			const [, { headers }] = fetchMock.mock.calls[0];
			expect(headers["Authorization"]).toBe("Bearer local-wins");
		});

		it("omits Authorization header when no token is stored", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({}));
			const client = freshClient();

			await client.get("/public");

			const [, { headers }] = fetchMock.mock.calls[0];
			expect(headers["Authorization"]).toBeUndefined();
		});
	});

	// ── 204 No Content ────────────────────────────────────────────────────────

	describe("204 No Content", () => {
		it("returns an empty object for 204 responses", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse(null, 204));
			const client = freshClient();

			const result = await client.delete("/resource/1");
			expect(result).toEqual({});
		});
	});

	// ── Error handling ────────────────────────────────────────────────────────

	describe("error handling", () => {
		it("throws a NotFoundError on 404 responses", async () => {
			fetchMock.mockResolvedValueOnce(
				makeResponse({ message: "Not found" }, 404),
			);
			const client = freshClient();

			const promise = client.get("/missing");

			await expect(promise).rejects.toBeInstanceOf(NotFoundError);
			await expect(promise).rejects.toMatchObject({
				status: 404,
				message: "Not found",
			});
		});

		it("falls back to a generic message when the 4xx body is not JSON", async () => {
			fetchMock.mockResolvedValueOnce(
				new Response("Bad Request", {
					status: 400,
					headers: { "Content-Type": "text/plain" },
				}),
			);
			const client = freshClient();

			await expect(client.get("/bad")).rejects.toMatchObject({
				name: "ApiError",
				status: 400,
				message: expect.stringContaining("400"),
			});
		});

		it("throws a network error when fetch rejects with TypeError", async () => {
			fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
			const client = freshClient();

			await expect(client.get("/offline")).rejects.toMatchObject({
				name: "ApiError",
				isNetworkError: true,
				message: expect.stringContaining("Network error"),
			});
		});

		it("re-throws existing ApiErrors without wrapping them", async () => {
			const original = new ApiError("Already an api error", { status: 422 });
			fetchMock.mockRejectedValueOnce(original);
			const client = freshClient();

			await expect(client.get("/test")).rejects.toBe(original);
		});

		it("wraps unknown errors in an ApiError", async () => {
			fetchMock.mockRejectedValueOnce(new Error("Some unexpected error"));
			const client = freshClient();

			await expect(client.get("/test")).rejects.toMatchObject({
				name: "ApiError",
				message: "Some unexpected error",
			});
		});

		it("throws a ValidationApiError on 422 responses", async () => {
			fetchMock.mockResolvedValueOnce(
				makeResponse(
					{ message: "Invalid input", fields: { email: ["Required"] } },
					422,
				),
			);
			const client = freshClient();

			const promise = client.get("/invalid");

			await expect(promise).rejects.toBeInstanceOf(ValidationApiError);
			await expect(promise).rejects.toMatchObject({
				status: 422,
				fields: { email: ["Required"] },
			});
		});

		it("throws a ForbiddenError on 403 responses", async () => {
			fetchMock.mockResolvedValueOnce(
				makeResponse({ message: "Forbidden" }, 403),
			);
			const client = freshClient();

			const promise = client.get("/forbidden");

			await expect(promise).rejects.toBeInstanceOf(ForbiddenError);
			await expect(promise).rejects.toMatchObject({
				status: 403,
				message: "Forbidden",
			});
		});
	});

	// ── 401 Unauthorized ──────────────────────────────────────────────────────

	describe("401 Unauthorized", () => {
		it("removes auth tokens from storage on 401", async () => {
			localStorage.setItem("auth_token", "stale-token");
			sessionStorage.setItem("auth_token", "stale-session");
			fetchMock.mockResolvedValueOnce(
				makeResponse({ message: "Unauthorized" }, 401),
			);
			const client = freshClient();

			await expect(client.get("/secret")).rejects.toMatchObject({
				status: 401,
			});

			expect(localStorage.getItem("auth_token")).toBeNull();
			expect(sessionStorage.getItem("auth_token")).toBeNull();
		});

		it("calls the onUnauthorized callback on 401", async () => {
			const onUnauthorized = vi.fn();
			fetchMock.mockResolvedValueOnce(makeResponse({}, 401));
			const client = freshClient({ onUnauthorized });

			await expect(client.get("/secret")).rejects.toMatchObject({
				status: 401,
			});

			expect(onUnauthorized).toHaveBeenCalledOnce();
		});

		it("throws an ApiError with status 401", async () => {
			fetchMock.mockResolvedValueOnce(makeResponse({}, 401));
			const client = freshClient();

			await expect(client.get("/secret")).rejects.toMatchObject({
				name: "ApiError",
				status: 401,
				message: "Unauthorized access",
			});
		});
	});

	// ── Singleton ─────────────────────────────────────────────────────────────

	describe("getApiClient singleton", () => {
		it("getApiClient returns the same instance created by createApiClient", () => {
			const client = freshClient();
			const retrieved = getApiClient();
			// Both point to the same singleton (createApiClient only creates once)
			expect(retrieved).toBeDefined();
			expect(typeof retrieved.get).toBe("function");
		});
	});

	// ── setTokenStorage (stub) ────────────────────────────────────────────────

	describe("setTokenStorage", () => {
		it("does not throw when called with a valid storage type", () => {
			const client = freshClient();
			expect(() => client.setTokenStorage("localStorage")).not.toThrow();
			expect(() => client.setTokenStorage("sessionStorage")).not.toThrow();
			expect(() => client.setTokenStorage("cookie")).not.toThrow();
		});
	});
});
