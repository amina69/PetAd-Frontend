export class ApiError extends Error {
	status?: number;
	code?: string;
	data?: unknown;
	isNetworkError?: boolean;

	constructor(
		message: string,
		options?: {
			status?: number;
			code?: string;
			data?: unknown;
			isNetworkError?: boolean;
		},
	) {
		super(message);
		this.name = "ApiError";
		this.status = options?.status;
		this.code = options?.code;
		this.data = options?.data;
		this.isNetworkError = options?.isNetworkError;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class ValidationApiError extends ApiError {
	fields: Record<string, string[]>;

	constructor(
		message: string,
		fields: Record<string, string[]>,
		options?: {
			status?: number;
			code?: string;
			data?: unknown;
		},
	) {
		super(message, options);
		this.name = "ValidationApiError";
		this.fields = fields;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class NetworkError extends ApiError {
	constructor(message = "You appear to be offline") {
		super(message, {
			code: "NETWORK_ERROR",
			isNetworkError: true,
		});
		this.name = "NetworkError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/**
 * A request that exceeded the client-side timeout.
 *
 * Kept distinct from a generic `ApiError` so callers (and the global error
 * toast) can offer retry copy instead of "something went wrong".
 */
export class TimeoutError extends ApiError {
	constructor(
		message = "The server took too long to respond. Please try again.",
	) {
		super(message, { code: "TIMEOUT" });
		this.name = "TimeoutError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class NotFoundError extends ApiError {
	constructor(
		message: string,
		options?: {
			status?: number;
			code?: string;
			data?: unknown;
		},
	) {
		super(message, options);
		this.name = "NotFoundError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class ForbiddenError extends ApiError {
	constructor(
		message: string,
		options?: {
			status?: number;
			code?: string;
			data?: unknown;
		},
	) {
		super(message, options);
		this.name = "ForbiddenError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
