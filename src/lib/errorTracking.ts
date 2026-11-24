import * as Sentry from "@sentry/react";
import type { ErrorEvent } from "@sentry/react";
import { isAnalyticsEnabled } from "./analytics";
import { logger } from "./logger";
import { REDACTED, scrubString, scrubValue } from "./scrub";

/**
 * Privacy-gated error tracking.
 *
 * - Disabled unless `VITE_SENTRY_DSN` is set *and* analytics consent has been
 *   given (the same `VITE_ENABLE_ANALYTICS` gate as `analytics.ts`, issue 197).
 *   When disabled, no Sentry client is created, so no tracking network calls
 *   can occur.
 * - `beforeSend` removes request bodies and cookies, and scrubs everything
 *   else (emails, tokens, document names) through `scrub.ts` (issue 97).
 * - Events carry the build's release id (`VITE_RELEASE`, the git SHA in CI) and
 *   environment (`VITE_APP_ENV`), so uploaded source maps resolve to readable
 *   stack traces (issue 779).
 * - The app's `ErrorBoundary` reports render failures through `captureError`
 *   (issue 69).
 */

let initialised = false;

function dsn(): string | undefined {
  const value = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  return value && value.trim() !== "" ? value.trim() : undefined;
}

function release(): string | undefined {
  const value = import.meta.env.VITE_RELEASE as string | undefined;
  return value && value.trim() !== "" ? value.trim() : undefined;
}

function environment(): string {
  const value = import.meta.env.VITE_APP_ENV as string | undefined;
  return value && value.trim() !== "" ? value.trim() : import.meta.env.MODE;
}

/** True only when a DSN is configured and the user has consented to analytics. */
export function isErrorTrackingEnabled(): boolean {
  return dsn() !== undefined && isAnalyticsEnabled();
}

function scrubRecord<T>(value: T): T {
  return scrubValue(value) as T;
}

/**
 * `beforeSend` hook: strips request bodies and cookies before any event leaves
 * the browser. Exported so the redaction rules can be unit tested in isolation.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const clean: ErrorEvent = { ...event };

  if (clean.request) {
    const request = { ...clean.request };

    // The request body can contain documents, messages and credentials.
    request.data = REDACTED;
    // Never send cookies, not even their names.
    delete request.cookies;
    if (request.headers) request.headers = scrubRecord(request.headers);
    if (request.url) request.url = scrubString(request.url);
    if (typeof request.query_string === "string") {
      request.query_string = scrubString(request.query_string);
    }

    clean.request = request;
  }

  if (clean.user) {
    // Keep the opaque id only; drop email, username and ip_address.
    clean.user = clean.user.id === undefined ? {} : { id: clean.user.id };
  }

  if (typeof clean.message === "string") {
    clean.message = scrubString(clean.message);
  }

  if (clean.exception?.values) {
    clean.exception = {
      ...clean.exception,
      values: clean.exception.values.map((exception) =>
        typeof exception.value === "string"
          ? { ...exception, value: scrubString(exception.value) }
          : exception,
      ),
    };
  }

  if (clean.extra) clean.extra = scrubRecord(clean.extra);
  if (clean.tags) clean.tags = scrubRecord(clean.tags);
  if (clean.contexts) clean.contexts = scrubRecord(clean.contexts);
  if (clean.breadcrumbs) clean.breadcrumbs = scrubRecord(clean.breadcrumbs);

  return clean;
}

/**
 * Initialises Sentry. Returns whether a client was created; calling it again
 * is a no-op. Without a DSN or consent this does nothing and makes no requests.
 */
export function initErrorTracking(): boolean {
  const sentryDsn = dsn();
  if (!sentryDsn || !isErrorTrackingEnabled() || initialised) return false;

  Sentry.init({
    dsn: sentryDsn,
    release: release(),
    environment: environment(),
    // We only collect error events. Disable every automatic data collection
    // channel as the first layer; `beforeSend` scrubs whatever remains.
    tracesSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    beforeSend: scrubEvent,
  });

  initialised = true;
  logger.debug("[error-tracking] initialised", {
    environment: environment(),
    release: release(),
  });
  return true;
}

/** Reports an error when tracking is enabled; a no-op otherwise. */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!initialised || !isErrorTrackingEnabled()) return;

  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(
    err,
    context
      ? { extra: scrubValue(context) as Record<string, unknown> }
      : undefined,
  );
}

/** Test-only: reset module state. */
export function __resetErrorTrackingForTests(): void {
  initialised = false;
}
