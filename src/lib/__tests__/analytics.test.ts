import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetAnalyticsForTests,
  initAnalytics,
  reportError,
  sanitizeEvent,
  trackEvent,
} from "../analytics";

describe("analytics", () => {
  const sendBeacon = vi.fn();
  const fetchSpy = vi.fn(() => Promise.resolve(new Response(null)));

  beforeEach(() => {
    vi.stubEnv("VITE_ANALYTICS_ENDPOINT", "https://collector.example.com/v1");
    vi.stubGlobal("fetch", fetchSpy);
    Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
    __resetAnalyticsForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("flag off", () => {
    it.each([undefined, "false", "TRUE", "1"])(
      "makes no network calls when VITE_ENABLE_ANALYTICS=%s",
      (value) => {
        vi.stubEnv("VITE_ENABLE_ANALYTICS", value as string);
        const addListener = vi.spyOn(window, "addEventListener");

        initAnalytics();
        trackEvent("page_view", { route: "/home" });
        reportError(new Error("boom"));

        expect(sendBeacon).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(addListener).not.toHaveBeenCalledWith("error", expect.anything());
      },
    );
  });

  describe("flag on", () => {
    beforeEach(() => vi.stubEnv("VITE_ENABLE_ANALYTICS", "true"));

    it("sends allow-listed events", () => {
      trackEvent("approval_decision", { decision: "approved" });
      expect(sendBeacon).toHaveBeenCalledWith(
        "https://collector.example.com/v1/events",
        JSON.stringify({ name: "approval_decision", props: { decision: "approved" } }),
      );
    });

    it("drops events that are not in the allow-list", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      trackEvent("user_typed_something", { text: "hello" });
      expect(sendBeacon).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it("scrubs error reports", () => {
      reportError(new Error("failed for jane@example.com with Bearer abc.def.ghi"));
      const body = JSON.parse(sendBeacon.mock.calls[0][1] as string);
      expect(body.message).not.toContain("jane@example.com");
      expect(body.message).not.toContain("abc.def.ghi");
    });
  });

  describe("sanitizeEvent (PII stripping)", () => {
    it("strips properties that are not allow-listed", () => {
      const result = sanitizeEvent("dispute_raised", {
        type: "no_show",
        email: "jane@example.com",
        phone: "+234 801 234 5678",
        documentName: "passport-jane-doe.pdf",
        comment: "He never answered",
      });
      expect(result).toEqual({ name: "dispute_raised", props: { type: "no_show" } });
    });

    it.each([
      ["email", "jane@example.com"],
      ["phone", "+2348012345678"],
      ["document name with spaces", "Jane Doe passport.pdf"],
      ["free text", "I would like to adopt this dog because..."],
    ])("rejects %s even under an allow-listed key", (_label, value) => {
      const result = sanitizeEvent("document_uploaded", { kind: value, sizeBucket: 2 });
      expect(result?.props).toEqual({ sizeBucket: 2 });
    });

    it("strips query strings from route values", () => {
      expect(sanitizeEvent("page_view", { route: "/reset?token=secret" })?.props.route).toBe("/reset");
    });

    it("returns null for unknown events", () => {
      expect(sanitizeEvent("nope", {})).toBeNull();
      expect(sanitizeEvent("constructor", {})).toBeNull();
    });
  });
});
