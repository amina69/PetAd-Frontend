export const OUTAGE_FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 30_000;

export interface ResilienceStatus {
  offline: boolean;
  serviceUnavailable: boolean;
}

function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

let status: ResilienceStatus = {
  offline: isBrowserOffline(),
  serviceUnavailable: false,
};
let failureTimes: number[] = [];
const listeners = new Set<() => void>();

export function getResilienceStatus(): ResilienceStatus {
  return status;
}

export function subscribeToResilienceStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(nextStatus: ResilienceStatus): void {
  if (
    status.offline === nextStatus.offline &&
    status.serviceUnavailable === nextStatus.serviceUnavailable
  ) {
    return;
  }

  status = nextStatus;
  for (const listener of listeners) listener();
}

export function setNetworkOnline(online: boolean): void {
  publish({ ...status, offline: !online });
}

export function recordApiFailure(): void {
  const now = Date.now();
  failureTimes = failureTimes.filter(
    (failedAt) => now - failedAt < FAILURE_WINDOW_MS,
  );
  failureTimes.push(now);
  publish({
    offline: isBrowserOffline(),
    serviceUnavailable: failureTimes.length >= OUTAGE_FAILURE_THRESHOLD,
  });
}

export function recordApiSuccess(): void {
  failureTimes = [];
  publish({ offline: isBrowserOffline(), serviceUnavailable: false });
}

export function __resetResilienceForTests(): void {
  failureTimes = [];
  publish({ offline: isBrowserOffline(), serviceUnavailable: false });
}
