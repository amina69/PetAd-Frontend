import { QueryClient, QueryCache } from "@tanstack/react-query";

function exponentialDelay(retryAttempt: number): number {
	return Math.pow(2, retryAttempt) * 1000;
}

function logApiError(error: unknown): void {
	const errorMessage =
		error instanceof Error ? error.message : "An unknown error occurred";
	console.error("[API Error]", errorMessage);
}

function showToastForServerErrors(error: unknown): void {
	if (
		error &&
		typeof error === "object" &&
		"status" in error &&
		error.status === 500
	) {
		console.warn("[Toast] Server error occurred. Please try again later.");
	}
}

const queryErrorHandler = (error: unknown) => {
	logApiError(error);
	showToastForServerErrors(error);
};

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: queryErrorHandler,
	}),
	defaultOptions: {
		queries: {
			staleTime: 30 * 1000,
			retry: 2,
			retryDelay: exponentialDelay,
		},
		mutations: {
			retry: 0,
			onError: (error: unknown) => {
				logApiError(error);
				showToastForServerErrors(error);
			},
		},
	},
});