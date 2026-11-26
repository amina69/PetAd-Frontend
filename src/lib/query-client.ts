import { QueryClient, QueryCache } from "@tanstack/react-query";
import { logger } from "./logger";

type QueryErrorToast = (message: string) => void;

let queryErrorToast: QueryErrorToast = (message) => {
	logger.warn("[Toast]", message);
};

/** Register the app toast used for unexpected query and mutation failures. */
export function registerQueryErrorToast(handler: QueryErrorToast): () => void {
	queryErrorToast = handler;
	return () => {
		queryErrorToast = (message) => {
			logger.warn("[Toast]", message);
		};
	};
}

function exponentialDelay(retryAttempt: number): number {
	return Math.pow(2, retryAttempt) * 1000;
}

function statusOf(error: unknown): number | undefined {
	if (error && typeof error === "object" && "status" in error) {
		const status = Number((error as { status?: number }).status);
		return Number.isFinite(status) ? status : undefined;
	}
	return undefined;
}

function isClientError(error: unknown): boolean {
	const status = statusOf(error);
	return status !== undefined && status >= 400 && status < 500;
}

/** One retry for unexpected failures. 4xx responses are not retried. */
export function retryQuery(failureCount: number, error: unknown): boolean {
	if (isClientError(error)) return false;
	return failureCount < 1;
}

function logApiError(error: unknown): void {
	const errorMessage =
		error instanceof Error ? error.message : "An unknown error occurred";
	logger.error("[API Error]", errorMessage);
}

function showToastForUnexpectedErrors(error: unknown): void {
	if (isClientError(error)) return;
	const message =
		error instanceof Error && error.message
			? error.message
			: "Something went wrong. Please try again.";
	queryErrorToast(message);
}

const queryErrorHandler = (error: unknown) => {
	logApiError(error);
	showToastForUnexpectedErrors(error);
};

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: queryErrorHandler,
	}),
	defaultOptions: {
		queries: {
			staleTime: 30 * 1000,
			retry: retryQuery,
			retryDelay: exponentialDelay,
			refetchOnWindowFocus: false,
		},
		mutations: {
			retry: 0,
			onError: (error: unknown) => {
				logApiError(error);
				showToastForUnexpectedErrors(error);
			},
		},
	},
});