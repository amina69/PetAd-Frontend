import { logger } from "./logger";
import { scrubString, scrubValue } from "./scrub";

/**
 * Privacy-gated analytics.
 *
 * - Off unless `VITE_ENABLE_ANALYTICS === 'true'`. When off, `initAnalytics`,
 *   `trackEvent` and `reportError` are inert: no listeners, no network calls.
 * - Events are allow-listed: unknown event names are dropped, and only the
 *   listed property keys survive. Property values must be numbers, booleans or
 *   short enum-like tokens, so free text, emails, phone numbers and document
 *   names can never be sent even if a caller passes them.
 * - Error reports are scrubbed of PII and secrets before sending.
 *
 * Events are delivered to `VITE_ANALYTICS_ENDPOINT`. With no endpoint, they
 * are only logged in development.
 */

export type AnalyticsProps = Record<string, string | number | boolean>;

/** event name -> property keys allowed on that event. */
export const EVENT_ALLOW_LIST = {
  page_view: ["route"],
  adoption_started: ["petCategory"],
  adoption_completed: ["petCategory"],
  custody_requested: ["petCategory"],
  approval_decision: ["decision"],
  dispute_raised: ["type"],
  document_uploaded: ["kind", "sizeBucket"],
  notification_opened: ["type"],
} as const satisfies Record<string, readonly string[]>;

export type AnalyticsEvent = keyof typeof EVENT_ALLOW_LIST;

// Enum-like tokens only (e.g. "approved", "id_card", "/listings"): no spaces, no '@'.
const SAFE_STRING = /^[A-Za-z0-9_\-/.]{1,64}$/;

let initialised = false;

export function isAnalyticsEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_ANALYTICS === "true";
}

function endpoint(): string | undefined {
  const url = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  return url || undefined;
}

/** Keeps only allow-listed keys with safe primitive values. */
export function sanitizeEvent(
  name: string,
  props: Record<string, unknown> = {},
): { name: AnalyticsEvent; props: AnalyticsProps } | null {
  if (!Object.prototype.hasOwnProperty.call(EVENT_ALLOW_LIST, name)) return null;
  const allowed = EVENT_ALLOW_LIST[name as AnalyticsEvent] as readonly string[];

  const clean: AnalyticsProps = {};
  for (const key of allowed) {
    const value = props[key];
    if (typeof value === "number" && Number.isFinite(value)) clean[key] = value;
    else if (typeof value === "boolean") clean[key] = value;
    else if (typeof value === "string") {
      // Route-like values may carry ids/tokens in the query or hash; drop them first.
      const bare = value.split(/[?#]/)[0];
      if (SAFE_STRING.test(bare)) clean[key] = bare;
    }
  }
  return { name: name as AnalyticsEvent, props: clean };
}

function send(path: string, body: unknown): void {
  const url = endpoint();
  if (!url) {
    logger.debug("[analytics]", path, body);
    return;
  }
  const payload = JSON.stringify(body);
  // credentials omitted: analytics must never carry cookies.
  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(`${url}/${path}`, payload);
  } else {
    void fetch(`${url}/${path}`, {
      method: "POST",
      body: payload,
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => undefined);
  }
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || initialised) return;
  initialised = true;

  window.addEventListener("error", (event) => {
    reportError(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason);
  });
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  const event = sanitizeEvent(name, props);
  if (!event) {
    logger.warn("[analytics] dropped event not in allow-list:", name);
    return;
  }
  send("events", event);
}

/** Sends a PII-scrubbed error report (name, message, stack only). */
export function reportError(error: unknown): void {
  if (!isAnalyticsEnabled()) return;
  const err = error instanceof Error ? error : new Error(String(error));
  send("errors", {
    name: err.name,
    message: scrubString(err.message),
    stack: err.stack ? scrubString(err.stack) : undefined,
    context: scrubValue({ route: window.location.pathname }),
  });
}

/** Test-only: reset module state. */
export function __resetAnalyticsForTests(): void {
  initialised = false;
}
