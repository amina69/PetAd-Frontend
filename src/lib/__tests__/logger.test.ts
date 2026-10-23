import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../logger";
import { REDACTED, scrubString, scrubValue } from "../scrub";

describe("logger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("no-ops debug and info in production", () => {
    vi.stubEnv("PROD", true);
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logger.debug("hidden");
    logger.info("hidden");

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
  });

  it("emits debug outside production", () => {
    vi.stubEnv("PROD", false);
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    logger.debug("visible");
    expect(debug).toHaveBeenCalledWith("visible");
  });

  it("still emits warn/error in production, scrubbed", () => {
    vi.stubEnv("PROD", true);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.error("login failed for jane@example.com", { password: "hunter2", petId: "p1" });

    expect(error).toHaveBeenCalledWith("login failed for [redacted]", {
      password: REDACTED,
      petId: "p1",
    });
  });
});

describe("scrub", () => {
  it("redacts sensitive keys recursively", () => {
    expect(
      scrubValue({
        headers: { Authorization: "Bearer x", Cookie: "sid=1" },
        body: { email: "a@b.co" },
        status: 500,
        nested: [{ phone: "+2348012345678", id: "9" }],
      }),
    ).toEqual({
      headers: { Authorization: REDACTED, Cookie: REDACTED },
      body: REDACTED,
      status: 500,
      nested: [{ phone: REDACTED, id: "9" }],
    });
  });

  it("scrubs emails, phones, JWTs and query secrets from strings", () => {
    const out = scrubString(
      "call +234 801 234 5678 or a@b.co at /x?token=abc&ok=1 jwt eyJhbGciOi.eyJzdWIiOi.sig",
    );
    expect(out).not.toMatch(/a@b\.co|801|token=abc|eyJhbGciOi/);
    expect(out).toContain("ok=1");
  });

  it("keeps only name and scrubbed message for Errors (no response data)", () => {
    const err = Object.assign(new Error("fail a@b.co"), { data: { password: "x" } });
    expect(scrubValue(err)).toEqual({ name: "Error", message: "fail [redacted]" });
  });
});
