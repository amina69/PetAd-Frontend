import type { ApiClientConfig } from "../types/auth";
import { ApiError, NetworkError, TimeoutError, ValidationApiError } from "./api-errors";
import { reportApiFailure, reportApiSuccess } from "./apiHealth";
import { logger } from "./logger";
import { queryClient } from "./query-client";
import { markSessionUnauthenticated, redirectToLogin } from "./session";

/** Default per-request timeout. Override via `ApiClientConfig.timeoutMs`. */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Default automatic retries for idempotent requests (GET/HEAD). */
export const DEFAULT_MAX_RETRIES = 2;

/** Base delay for the jittered exponential retry backoff. */
export const DEFAULT_RETRY_BASE_DELAY_MS = 300;

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD"]);

/**
 * Request options accepted by every `ApiClient` verb.
 *
 * `idempotencyKey` is sent as the `Idempotency-Key` header so create actions
 * can safely be retried by the caller (or de-duplicated by the backend).
 */
export interface ApiRequestOptions extends RequestInit {
	idempotencyKey?: string;
}

/** Generate a client-side idempotency key for create actions. */
export function createIdempotencyKey(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	// Fallback for older browsers / test environments without crypto.randomUUID.
	return `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isIdempotentMethod(method: string): boolean {
	return IDEMPOTENT_METHODS.has(method.toUpperCase());
}

/**
 * Failures worth retrying automatically: server errors, timeouts and network
 * failures. 4xx responses are deterministic and must not be retried.
 */
function isRetryableError(error: unknown): boolean {
	if (error instanceof NetworkError || error instanceof TimeoutError) return true;
	if (error instanceof ApiError) {
		return error.status !== undefined && error.status >= 500;
	}
	return false;
}

/**
 * Jittered exponential backoff. Full jitter spreads concurrent retries so a
 * recovered backend is not hit by a synchronised thundering herd.
 */
export function retryDelayMs(attempt: number, baseDelayMs: number): number {
	const backoff = baseDelayMs * Math.pow(2, attempt);
	return Math.round(backoff + Math.random() * baseDelayMs);
}

function sleep(ms: number): Promise<void> {
	if (ms <= 0) return Promise.resolve();
	return new Promise((resolve) => setTimeout(resolve, ms));
}

class ApiClient {
	private baseURL: string;
	private defaultHeaders: Record<string, string>;
	private onUnauthorized?: () => void;
	private unauthorizedHandled = false;
	private timeoutMs: number;
	private maxRetries: number;
	private retryBaseDelayMs: number;

	constructor(config: ApiClientConfig) {
		this.baseURL = config.baseURL;
		this.defaultHeaders = {
			"Content-Type": "application/json",
			...config.headers,
		};
		this.onUnauthorized = config.onUnauthorized;
		this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
		this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
		this.retryBaseDelayMs = config.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
	}

	private getToken(): string | null {
		if (typeof window !== "undefined") {
			const localToken = localStorage.getItem("auth_token");
			if (localToken) return localToken;

			const sessionToken = sessionStorage.getItem("auth_token");
			if (sessionToken) return sessionToken;
		}
		return null;
	}

	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			...this.defaultHeaders,
		};

		const token = this.getToken();
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		return headers;
	}

	private expireSession(): void {
		if (typeof window !== "undefined") {
			localStorage.removeItem("auth_token");
			sessionStorage.removeItem("auth_token");
		}

		if (this.unauthorizedHandled) return;
		this.unauthorizedHandled = true;
		queryClient.clear();
		markSessionUnauthenticated();

		if (this.onUnauthorized) {
			this.onUnauthorized();
			return;
		}

		redirectToLogin();
	}

	private async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			if (response.status === 401) {
				this.expireSession();

				throw new ApiError("Unauthorized access", {
					status: 401,
					code: "UNAUTHORIZED",
				});
			}

			let errorData: unknown;
			let message = `Request failed with status ${response.status}`;

			try {
				const text = await response.text(); // read ONCE

				if (text) {
					try {
						const json = JSON.parse(text);
						errorData = json;
						if (json?.message) message = json.message;
					} catch {
						errorData = text;
					}
				}
			} catch {
				errorData = `Request failed with status ${response.status}`;
			}

			const code = (errorData as { code?: string } | undefined)?.code;

			// Normalize all errors to ApiError (except validation)
if (response.status === 422) {
  const fields =
    (errorData as { fields?: Record<string, string[]> } | undefined)?.fields ??
    (errorData as { errors?: Record<string, string[]> } | undefined)?.errors ??
    {};

  throw new ValidationApiError(message, fields, {
    status: 422,
    code,
    data: errorData,
  });
}

			throw new ApiError(message, {
				status: response.status,
				code,
				data: errorData,
			});
		}

		// Handle empty responses
		if (response.status === 204) {
			return {} as T;
		}

		return response.json();
	}

	/**
	 * Run `fetch` with a hard timeout. A caller-provided signal is composed
	 * with the internal one, so either can abort the request.
	 */
	private async fetchWithTimeout(
		url: string,
		init: RequestInit,
	): Promise<Response> {
		const controller = new AbortController();
		const externalSignal = init.signal ?? undefined;
		let timedOut = false;

		const timeoutId =
			this.timeoutMs > 0
				? setTimeout(() => {
						timedOut = true;
						controller.abort();
					}, this.timeoutMs)
				: undefined;

		const onExternalAbort = () => controller.abort();

		if (externalSignal) {
			if (externalSignal.aborted) {
				controller.abort();
			} else {
				externalSignal.addEventListener("abort", onExternalAbort, { once: true });
			}
		}

		try {
			return await fetch(url, { ...init, signal: controller.signal });
		} catch (error) {
			if (timedOut) {
				throw new TimeoutError();
			}
			// A caller-initiated abort must surface as an AbortError, not a
			// network/timeout failure.
			throw error;
		} finally {
			if (timeoutId !== undefined) clearTimeout(timeoutId);
			externalSignal?.removeEventListener("abort", onExternalAbort);
		}
	}

	/** Normalize thrown values into the ApiError family. */
	private normalizeError(error: unknown): unknown {
		if (error instanceof Error && error.name === "AbortError") {
			return error;
		}

		const offline =
			(typeof navigator !== "undefined" && navigator.onLine === false) ||
			(error instanceof TypeError && error.message === "Failed to fetch");

		if (offline) {
			return new NetworkError();
		}

		if (
			error instanceof ApiError ||
			(error as Error | undefined)?.name === "ApiError"
		) {
			return error;
		}

		return new ApiError(
			error instanceof Error ? error.message : "Unknown error occurred",
		);
	}

	private async request<T>(
		endpoint: string,
		options: ApiRequestOptions = {},
	): Promise<T> {
		const { idempotencyKey, ...init } = options;
		const url = `${this.baseURL}${endpoint}`;
		const headers = this.getHeaders() as Record<string, string>;

		if (idempotencyKey) {
			headers["Idempotency-Key"] = idempotencyKey;
		}

		// Multipart bodies need the browser to set Content-Type (with the boundary).
		if (typeof FormData !== "undefined" && init.body instanceof FormData) {
			delete headers["Content-Type"];
		}

		const method = init.method ?? "GET";
		// Non-idempotent requests (POST/PUT/PATCH/DELETE) are never auto-retried:
		// replaying them could double-charge, duplicate a listing or resolve a
		// dispute twice.
		const maxRetries = isIdempotentMethod(method) ? this.maxRetries : 0;

		for (let attempt = 0; ; attempt++) {
			try {
				const response = await this.fetchWithTimeout(url, {
					...init,
					headers: {
						...headers,
						...init.headers,
					},
				});

				const data = await this.handleResponse<T>(response);
				// One logical success means the API is reachable again.
				reportApiSuccess();
				return data;
			} catch (error) {
				const normalized = this.normalizeError(error);

				if (attempt < maxRetries && isRetryableError(normalized)) {
					logger.warn(
						`[API] ${method} ${endpoint} failed, retry ${attempt + 1}/${maxRetries}`,
					);
					await sleep(retryDelayMs(attempt, this.retryBaseDelayMs));
					continue;
				}

				// Only server/network failures count towards degraded mode; a
				// 4xx or a caller abort still proves the API is reachable.
				if (isRetryableError(normalized)) {
					reportApiFailure();
				}

				throw normalized;
			}
		}
	}

	async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "GET" });
	}

	async post<T>(
		endpoint: string,
		data?: unknown,
		options?: ApiRequestOptions,
	): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: "POST",
			body:
				typeof FormData !== "undefined" && data instanceof FormData
					? data
					: data
						? JSON.stringify(data)
						: undefined,
		});
	}

	async put<T>(
		endpoint: string,
		data?: unknown,
		options?: ApiRequestOptions,
	): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: "PUT",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async patch<T>(
		endpoint: string,
		data?: unknown,
		options?: ApiRequestOptions,
	): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: "PATCH",
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: "DELETE" });
	}

	setTokenStorage(storage: "localStorage" | "sessionStorage" | "cookie") {
		logger.debug(`Token storage set to ${storage}`);
	}
}

let apiClientInstance: ApiClient | null = null;

export function createApiClient(config: ApiClientConfig): ApiClient {
	apiClientInstance = new ApiClient(config);
	return apiClientInstance;
}

export function getApiClient(): ApiClient {
	if (!apiClientInstance) {
		throw new Error("API client not initialized. Call createApiClient first.");
	}
	return apiClientInstance;
}

const isMockServiceWorkerEnabled = import.meta.env.VITE_MSW === "true";
const defaultApiUrl = isMockServiceWorkerEnabled ? "/api" : "http://localhost:3000/api";

// Vite environment variable
const API_URL = import.meta.env.VITE_API_URL ?? defaultApiUrl;

export const apiClient = createApiClient({
	baseURL: API_URL,
	onUnauthorized: () => {
		redirectToLogin();
	},
});
