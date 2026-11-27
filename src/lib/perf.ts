import { trackTiming } from "./analytics";
import { logger } from "./logger";

/**
 * Performance measurement module for critical client flows.
 *
 * Requirements (Issue #784 / #178):
 * - `performance.mark/measure` around:
 *   1. adoption submit
 *   2. document upload
 *   3. first notification render
 * - Sent as custom timings via the analytics sink (consent-gated)
 * - Dev overlay shows the numbers
 * - Measures exist in the Performance panel and are named consistently
 */

export const PERF_MEASURES = {
  ADOPTION_SUBMIT: "adoption:submit",
  DOCUMENT_UPLOAD: "document:upload",
  NOTIFICATION_FIRST_RENDER: "notification:first-render",
} as const;

export type PerfMeasureName =
  | (typeof PERF_MEASURES)[keyof typeof PERF_MEASURES]
  | (string & {});

export interface PerfMeasureRecord {
  id: string;
  name: string;
  duration: number;
  timestamp: number;
  props?: Record<string, unknown>;
}

export type PerfListener = (record: PerfMeasureRecord) => void;

let recordedMeasures: PerfMeasureRecord[] = [];
const listeners = new Set<PerfListener>();
let hasRecordedNotificationFirstRender = false;
let notificationRenderStartMarked = false;

function hasPerf(): boolean {
  return typeof performance !== "undefined";
}

/** Safely records a performance mark. */
export function recordMark(name: string): void {
  if (!hasPerf() || typeof performance.mark !== "function") return;
  try {
    performance.mark(name);
  } catch (err) {
    logger.debug(`[perf] Failed to create mark "${name}":`, err);
  }
}

/** Safely clears performance marks. */
export function clearMarks(name?: string): void {
  if (!hasPerf() || typeof performance.clearMarks !== "function") return;
  try {
    performance.clearMarks(name);
  } catch {
    // Ignore clear failures
  }
}

/** Safely clears performance measures. */
export function clearMeasures(name?: string): void {
  if (!hasPerf() || typeof performance.clearMeasures !== "function") return;
  try {
    performance.clearMeasures(name);
  } catch {
    // Ignore clear failures
  }
}

/**
 * Measures the duration between startMark and endMark, creates a standard
 * PerformanceMeasure in the browser's Performance panel, dispatches a custom timing
 * to the consent-gated analytics sink, and registers it for the Dev Overlay.
 */
export function recordMeasure(
  name: string,
  startMark?: string,
  endMark?: string,
  props?: Record<string, unknown>,
): number {
  let duration = 0;

  if (hasPerf() && typeof performance.measure === "function") {
    try {
      if (startMark && endMark) {
        performance.measure(name, startMark, endMark);
      } else if (startMark) {
        performance.measure(name, startMark);
      } else {
        performance.measure(name);
      }

      if (typeof performance.getEntriesByName === "function") {
        const entries = performance.getEntriesByName(name, "measure");
        if (entries.length > 0) {
          duration = entries[entries.length - 1].duration;
        }
      }
    } catch (err) {
      logger.debug(`[perf] performance.measure("${name}"):`, err);
    }
  }

  const roundedDuration = Math.max(0, Math.round(duration));

  const record: PerfMeasureRecord = {
    id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    duration: roundedDuration,
    timestamp: Date.now(),
    props,
  };

  recordedMeasures = [record, ...recordedMeasures].slice(0, 100);

  // Send as custom timing via the analytics sink (consent-gated)
  trackTiming(name, roundedDuration, props);

  // Notify dev overlay and other subscribers
  for (const listener of listeners) {
    try {
      listener(record);
    } catch {
      // Ignore listener error
    }
  }

  return roundedDuration;
}

/**
 * Begins a performance measurement for a critical flow.
 * Returns an `end(props?)` function that completes the measurement.
 *
 * Example:
 *   const end = startPerfMeasure(PERF_MEASURES.ADOPTION_SUBMIT);
 *   // perform submit...
 *   end();
 */
export function startPerfMeasure(
  name: PerfMeasureName,
): (props?: Record<string, unknown>) => number {
  const startMark = `${name}:start`;
  const endMark = `${name}:end`;
  const startTime = hasPerf() ? performance.now() : Date.now();

  recordMark(startMark);

  return (props?: Record<string, unknown>) => {
    recordMark(endMark);

    let duration = recordMeasure(name, startMark, endMark, props);

    // Fallback if performance.measure duration could not be extracted
    if (duration === 0 && hasPerf()) {
      const fallbackDuration = Math.max(0, Math.round(performance.now() - startTime));
      if (fallbackDuration > 0) {
        duration = fallbackDuration;
        // Update the latest recorded entry if needed
        const latest = recordedMeasures[0];
        if (latest && latest.name === name && latest.duration === 0) {
          latest.duration = duration;
        }
      }
    }

    return duration;
  };
}

/**
 * Wraps an async operation in a performance mark/measure.
 */
export async function measureAsync<T>(
  name: PerfMeasureName,
  fn: () => Promise<T>,
  props?: Record<string, unknown>,
): Promise<T> {
  const end = startPerfMeasure(name);
  try {
    return await fn();
  } finally {
    end(props);
  }
}

/**
 * Wraps a synchronous operation in a performance mark/measure.
 */
export function measureSync<T>(
  name: PerfMeasureName,
  fn: () => T,
  props?: Record<string, unknown>,
): T {
  const end = startPerfMeasure(name);
  try {
    return fn();
  } finally {
    end(props);
  }
}

/**
 * Marks the beginning of notification list loading/rendering.
 */
export function markNotificationRenderStart(): void {
  if (notificationRenderStartMarked) return;
  notificationRenderStartMarked = true;
  recordMark(`${PERF_MEASURES.NOTIFICATION_FIRST_RENDER}:start`);
}

/**
 * Records the critical flow "first notification render".
 * Only executes once per application lifecycle (or until reset).
 */
export function recordNotificationFirstRender(props?: Record<string, unknown>): number {
  if (hasRecordedNotificationFirstRender) {
    const existing = recordedMeasures.find(
      (m) => m.name === PERF_MEASURES.NOTIFICATION_FIRST_RENDER,
    );
    return existing ? existing.duration : 0;
  }
  hasRecordedNotificationFirstRender = true;

  const name = PERF_MEASURES.NOTIFICATION_FIRST_RENDER;
  const startMark = `${name}:start`;
  const endMark = `${name}:end`;

  if (!notificationRenderStartMarked) {
    // If start wasn't explicitly called, record mark at navigation start or early
    recordMark(startMark);
  }
  recordMark(endMark);

  return recordMeasure(name, startMark, endMark, props);
}

/** Returns the list of all recorded performance measures (for Dev Overlay). */
export function getPerfMeasures(): PerfMeasureRecord[] {
  return [...recordedMeasures];
}

/** Subscribes to new performance measure events (e.g. for Dev Overlay real-time updates). */
export function subscribePerf(listener: PerfListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Clears recorded performance measures and browser performance entries. */
export function clearPerfMeasures(): void {
  recordedMeasures = [];
  clearMarks();
  clearMeasures();
}

/** Test-only helper to reset module state. */
export function __resetPerfForTests(): void {
  recordedMeasures = [];
  listeners.clear();
  hasRecordedNotificationFirstRender = false;
  notificationRenderStartMarked = false;
  clearPerfMeasures();
}
