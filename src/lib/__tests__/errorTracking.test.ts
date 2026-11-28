import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ErrorEvent } from "@sentry/react";
import {
  __resetErrorTrackingForTests,
  captureError,
  initErrorTracking,
  isErrorTrackingEnabled,
  scrubEvent,
} from "../errorTracking";
import { REDACTED } from "../scrub";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@sentry/react", () => sentry);

describe("errorTracking", () => {
  const sendBeacon = vi.fn();
  const fetchSpy = vi.fn(() => Promise.resolve(new Response(null)));

  beforeEach(() => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
    });
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubEnv("VITE_ENABLE_ANALYTICS", "true");
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@o0.ingest.sentry.io/1");
    vi.stubEnv("VITE_RELEASE", "abc123");
    vi.stubEnv("VITE_APP_ENV", "staging");
    __resetErrorTrackingForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("gating", () => {
    it("does nothing and sends nothing without a DSN", () => {
      vi.stubEnv("VITE_SENTRY_DSN", undefined);

      expect(isErrorTrackingEnabled()).toBe(false);
      expect(initErrorTracking()).toBe(false);
      captureError(new Error("boom"));

      expect(sentry.init).not.toHaveBeenCalled();
      expect(sentry.captureException).not.toHaveBeenCalled();
      expect(sendBeacon).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it.each([undefined, "false", "TRUE", "1"])(
      "does not initialise when analytics consent is %s",
      (value) => {
        vi.stubEnv("VITE_ENABLE_ANALYTICS", value as string);

        expect(initErrorTracking()).toBe(false);
        captureError(new Error("boom"));

        expect(sentry.init).not.toHaveBeenCalled();
        expect(sentry.captureException).not.toHaveBeenCalled();
        expect(sendBeacon).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
      },
    );

    it("initialises once with release, environment and the scrubber", () => {
      expect(initErrorTracking()).toBe(true);
      expect(initErrorTracking()).toBe(false); // already initialised
      expect(sentry.init).toHaveBeenCalledTimes(1);

      const options = sentry.init.mock.calls[0][0] as {
        dsn: string;
        release: string;
        environment: string;
        tracesSampleRate: number;
        dataCollection: Record<string, unknown>;
        beforeSend: unknown;
      };
      expect(options.dsn).toBe("https://public@o0.ingest.sentry.io/1");
      expect(options.release).toBe("abc123");
      expect(options.environment).toBe("staging");
      expect(options.tracesSampleRate).toBe(0);
      expect(options.dataCollection).toMatchObject({
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
      });
      expect(options.beforeSend).toBe(scrubEvent);
    });

    it("does not capture before initialisation", () => {
      captureError(new Error("boom"));
      expect(sentry.captureException).not.toHaveBeenCalled();
    });

    it("captures an error with a scrubbed context after initialisation", () => {
      initErrorTracking();
      captureError(new Error("boom"), {
        adoptionId: "adoption_9",
        documentName: "passport-jane-doe.pdf",
        email: "jane@example.com",
      });

      expect(sentry.captureException).toHaveBeenCalledTimes(1);
      const [, captureContext] = sentry.captureException.mock.calls[0] as [
        Error,
        { extra: Record<string, unknown> },
      ];
      expect(captureContext.extra.adoptionId).toBe("adoption_9");
      expect(captureContext.extra.documentName).toBe(REDACTED);
      expect(captureContext.extra.email).toBe(REDACTED);
    });
  });

  describe("scrubEvent (PII stripping)", () => {
    it("strips request bodies, cookies, emails and document names", () => {
      const event = {
        type: undefined,
        request: {
          url: "https://app.example/listings?token=secret&email=jane@example.com",
          method: "POST",
          data: {
            email: "jane@example.com",
            password: "hunter2",
            documentName: "passport-jane-doe.pdf",
          },
          cookies: { session: "abc123" },
          headers: {
            Authorization: "Bearer abc.def.ghi",
            "Content-Type": "application/json",
          },
          query_string: "email=jane@example.com",
        },
        user: {
          id: "user_1",
          email: "jane@example.com",
          username: "jane",
          ip_address: "203.0.113.7",
        },
        message: "failed for jane@example.com",
        extra: {
          email: "jane@example.com",
          documentName: "passport-jane-doe.pdf",
          comment: "He never answered",
          adoptionId: "adoption_9",
          contact: "+234 801 234 5678",
        },
        tags: { route: "/documents" },
        exception: {
          values: [
            {
              type: "Error",
              value: "failed for jane@example.com",
              stacktrace: {
                frames: [{ filename: "assets/index-abc123.js", lineno: 1, colno: 42 }],
              },
            },
          ],
        },
      } as ErrorEvent;

      const clean = scrubEvent(event);
      const serialised = JSON.stringify(clean);

      expect(clean.request?.data).toBe(REDACTED);
      expect(clean.request?.cookies).toBeUndefined();
      expect(clean.request?.url).not.toContain("secret");
      expect(clean.request?.url).not.toContain("jane@example.com");
      expect(clean.request?.headers?.Authorization).toBe(REDACTED);
      expect(clean.request?.headers?.["Content-Type"]).toBe("application/json");

      expect(clean.user).toEqual({ id: "user_1" });
      expect(clean.extra?.documentName).toBe(REDACTED);
      expect(clean.extra?.comment).toBe(REDACTED);
      expect(clean.extra?.adoptionId).toBe("adoption_9");
      expect(clean.extra?.contact).toBe(REDACTED);

      expect(serialised).not.toContain("jane@example.com");
      expect(serialised).not.toContain("passport-jane-doe.pdf");
      expect(serialised).not.toContain("hunter2");
      expect(serialised).not.toContain("abc.def.ghi");
      expect(serialised).not.toContain("203.0.113.7");

      // Readable stack traces rely on minified file names staying intact.
      expect(clean.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename).toBe(
        "assets/index-abc123.js",
      );
    });

    it("keeps a scrubbed event usable when optional sections are absent", () => {
      const clean = scrubEvent({ type: undefined } as ErrorEvent);
      expect(clean).toEqual({ type: undefined });
    });
  });
});
