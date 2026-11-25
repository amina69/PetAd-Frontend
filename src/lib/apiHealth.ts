/**
 * Tiny observable store for API health.
 *
 * The `ApiClient` reports logical request outcomes here after retries are
 * exhausted; the degraded banner subscribes through `useApiHealth`. Keeping
 * this outside React means failures raised from plain service modules (and
 * from outside the QueryClient) still count.
 *
 * Degraded mode turns on when `FAILURE_THRESHOLD` server/network failures
 * happen inside `FAILURE_WINDOW_MS`, and turns off as soon as one request
 * succeeds again.
 */

export interface ApiHealthSnapshot {
	isDegraded: boolean;
}

/** How many failures inside the window before the banner appears. */
export const FAILURE_THRESHOLD = 3;

/** Sliding window for counting failures. */
export const FAILURE_WINDOW_MS = 30_000;

type Listener = () => void;

let failureTimestamps: number[] = [];
let degraded = false;
// useSyncExternalStore requires a stable reference between notifications.
let snapshot: ApiHealthSnapshot = { isDegraded: false };

const listeners = new Set<Listener>();

function publish(): void {
	snapshot = { isDegraded: degraded };
	for (const listener of listeners) listener();
}

/**
 * Record one logical failure (after retries). Only server errors and network
 * failures should be reported — 4xx responses mean the API is reachable.
 */
export function reportApiFailure(now: number = Date.now()): void {
	const cutoff = now - FAILURE_WINDOW_MS;
	failureTimestamps = failureTimestamps.filter((timestamp) => timestamp > cutoff);
	failureTimestamps.push(now);

	if (!degraded && failureTimestamps.length >= FAILURE_THRESHOLD) {
		degraded = true;
		publish();
	}
}

/** Record a successful request. Any success clears degraded mode. */
export function reportApiSuccess(): void {
	failureTimestamps = [];

	if (degraded) {
		degraded = false;
		publish();
	}
}

export function getApiHealthSnapshot(): ApiHealthSnapshot {
	return snapshot;
}

export function subscribeApiHealth(listener: Listener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/** Test helper: forget recorded failures and leave degraded mode. */
export function resetApiHealth(): void {
	failureTimestamps = [];
	if (degraded) {
		degraded = false;
		publish();
	} else {
		snapshot = { isDegraded: false };
	}
}
