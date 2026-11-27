import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDebugEnabled, logger, redact, setDebugFlag } from "../logger";
import { REDACTED, scrubString, scrubValue } from "../scrub";

describe("logger", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("no-ops debug and info in production", () => {
    vi.stubEnv("PROD", true);
    localStorage.setItem("debug", "true");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logger.debug("hidden");
    logger.info("hidden");
    logger.api.debug("hidden api");
    logger.realtime.debug("hidden realtime");
    logger.auth.debug("hidden auth");

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
  });

  it("suppresses debug outside production when localStorage flag is absent", () => {
    vi.stubEnv("PROD", false);
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

    logger.debug("should not log");
    logger.api.debug("should not log");

    expect(debug).not.toHaveBeenCalled();
  });

  it("emits debug outside production when localStorage flag is set", () => {
    vi.stubEnv("PROD", false);
    localStorage.setItem("debug", "true");
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

    logger.debug("visible");
    expect(debug).toHaveBeenCalledWith("visible");
  });

  it("still emits warn and error in production, scrubbed", () => {
    vi.stubEnv("PROD", true);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    logger.warn("warning for user@example.com", { token: "abc" });
    logger.error("login failed for jane@example.com", { password: "hunter2", petId: "p1" });

    expect(warn).toHaveBeenCalledWith("warning for [redacted]", { token: REDACTED });
    expect(error).toHaveBeenCalledWith("login failed for [redacted]", {
      password: REDACTED,
      petId: "p1",
    });
  });

  describe("namespaces", () => {
    it("prefixes messages with the namespace", () => {
      vi.stubEnv("PROD", false);
      localStorage.setItem("debug", "*");
      const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
      const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

      logger.api.debug("fetch pet", { id: "p1" });
      logger.realtime.info("socket connected");
      logger.auth.warn("session expiring");
      logger.api.error("api call failed");

      expect(debug).toHaveBeenCalledWith("[api]", "fetch pet", { id: "p1" });
      expect(info).toHaveBeenCalledWith("[realtime]", "socket connected");
      expect(warn).toHaveBeenCalledWith("[auth]", "session expiring");
      expect(error).toHaveBeenCalledWith("[api]", "api call failed");
    });

    it("filters debug output by namespace according to localStorage flag", () => {
      vi.stubEnv("PROD", false);
      localStorage.setItem("debug", "api,auth");
      const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

      logger.api.debug("api debug message");
      logger.auth.debug("auth debug message");
      logger.realtime.debug("realtime debug message");

      expect(debug).toHaveBeenCalledWith("[api]", "api debug message");
      expect(debug).toHaveBeenCalledWith("[auth]", "auth debug message");
      expect(debug).not.toHaveBeenCalledWith("[realtime]", "realtime debug message");
    });

    it("supports custom namespaces via forNamespace", () => {
      vi.stubEnv("PROD", false);
      setDebugFlag("billing");
      const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

      const billingLogger = logger.forNamespace("billing");
      billingLogger.debug("invoice processed");

      expect(debug).toHaveBeenCalledWith("[billing]", "invoice processed");
    });
  });

  describe("isDebugEnabled and setDebugFlag helpers", () => {
    it("manages debug flags via helper", () => {
      vi.stubEnv("PROD", false);
      expect(isDebugEnabled()).toBe(false);

      setDebugFlag(true);
      expect(isDebugEnabled()).toBe(true);
      expect(isDebugEnabled("api")).toBe(true);

      setDebugFlag("api");
      expect(isDebugEnabled("api")).toBe(true);
      expect(isDebugEnabled("realtime")).toBe(false);

      setDebugFlag(false);
      expect(isDebugEnabled()).toBe(false);
    });
  });
});

describe("redaction helper", () => {
  it("redacts sensitive keys and values in deeply nested objects", () => {
    const input = {
      id: "app-123",
      pet: {
        id: "pet-456",
        name: "Buddy",
        owner: {
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "+1-555-0199",
          address: "123 Pet St",
          auth: {
            token: "eyJhbGciOi.eyJzdWIiOi.sig",
            apiKey: "secret-key-999",
            password: "superSecretPassword!",
          },
        },
      },
      status: "PENDING",
    };

    const redacted = redact(input);

    expect(redacted).toEqual({
      id: "app-123",
      pet: {
        id: "pet-456",
        name: REDACTED,
        owner: {
          name: REDACTED,
          email: REDACTED,
          phone: REDACTED,
          address: REDACTED,
          auth: REDACTED,
        },
      },
      status: "PENDING",
    });

    // Verify original object was not mutated
    expect(input.pet.name).toBe("Buddy");
    expect(input.pet.owner.email).toBe("john.doe@example.com");
  });

  it("redacts sensitive data across arrays and nested arrays of objects", () => {
    const input = [
      {
        recipientEmail: "alice@example.com",
        items: [
          { token: "bearer-token-1", info: "Send receipt to bob@example.com" },
          { id: "item-2", userPhone: "+234 801 234 5678" },
        ],
      },
      [
        {
          authorization: "Bearer secret-jwt-abc",
          metadata: { contactPhone: "+1 (555) 234-5678" },
        },
      ],
      "Plain string with token: eyJhbGciOi.eyJzdWIiOi.sig and phone +15551234567",
    ];

    const redacted = redact(input);

    expect(redacted).toEqual([
      {
        recipientEmail: REDACTED,
        items: [
          { token: REDACTED, info: "Send receipt to [redacted]" },
          { id: "item-2", userPhone: REDACTED },
        ],
      },
      [
        {
          authorization: REDACTED,
          metadata: { contactPhone: REDACTED },
        },
      ],
      "Plain string with token: [redacted] and phone [redacted]",
    ]);
  });

  it("redacts free-text emails, phones, JWTs, and query secrets", () => {
    const out = scrubString(
      "call +234 801 234 5678 or a@b.co at /x?token=abc&ok=1 jwt eyJhbGciOi.eyJzdWIiOi.sig",
    );
    expect(out).not.toMatch(/a@b\.co|801|token=abc|eyJhbGciOi/);
    expect(out).toContain("ok=1");
  });

  it("keeps only name and scrubbed message for Errors", () => {
    const err = Object.assign(new Error("fail a@b.co"), { data: { password: "x" } });
    expect(scrubValue(err)).toEqual({ name: "Error", message: "fail [redacted]" });
  });

  it("exposes redact helper on logger instance", () => {
    expect(logger.redact).toBe(redact);
    const result = logger.redact({ email: "test@domain.com", publicId: 42 });
    expect(result).toEqual({ email: REDACTED, publicId: 42 });
  });
});
