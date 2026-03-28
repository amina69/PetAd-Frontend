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
