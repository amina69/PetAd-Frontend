import { useSyncExternalStore } from "react";
import {
	getApiHealthSnapshot,
	subscribeApiHealth,
} from "../lib/apiHealth";
import { getStatusPageUrl } from "../lib/env";

export interface ApiHealthState {
	/** True when repeated server/network failures were observed recently. */
	isDegraded: boolean;
	/** Optional public status page from `VITE_STATUS_PAGE_URL`. */
	statusPageUrl?: string;
}

/**
 * Subscribe to client-side API health.
 *
 * Degraded mode turns on after three 5xx/network failures inside 30 seconds
 * and turns off automatically on the next successful request.
 */
export function useApiHealth(): ApiHealthState {
	const snapshot = useSyncExternalStore(
		subscribeApiHealth,
		getApiHealthSnapshot,
		getApiHealthSnapshot,
	);

	return {
		isDegraded: snapshot.isDegraded,
		statusPageUrl: getStatusPageUrl(),
	};
}
