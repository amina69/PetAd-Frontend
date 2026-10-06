import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnvValidationError, validateEnv } from "./env";

const validEnv = {
  VITE_API_URL: "/api",
  VITE_MSW: "false",
  VITE_STELLAR_NETWORK: "testnet",
};

describe("validateEnv", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("accepts a valid environment and applies defaults", () => {
    const env = validateEnv({ ...validEnv });

    expect(env).toEqual({
      VITE_API_URL: "/api",
      VITE_MSW: "false",
      VITE_STELLAR_NETWORK: "testnet",
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("accepts an absolute http(s) API URL", () => {
    const env = validateEnv({
      ...validEnv,
      VITE_API_URL: "https://api.petad.example.com/api",
    });

    expect(env.VITE_API_URL).toBe("https://api.petad.example.com/api");
  });

  it("throws a named error when VITE_API_URL is missing", () => {
    const { VITE_API_URL: _missing, ...withoutApiUrl } = validEnv;

    expect(() => validateEnv(withoutApiUrl)).toThrowError(EnvValidationError);
    expect(() => validateEnv(withoutApiUrl)).toThrowError(/VITE_API_URL/);
    expect(() => validateEnv(withoutApiUrl)).toThrowError(/missing/);
  });

  it("throws a named error when VITE_API_URL is empty", () => {
    expect(() => validateEnv({ ...validEnv, VITE_API_URL: "" })).toThrowError(
      /VITE_API_URL.*missing/,
    );
  });

  it("throws a named error when VITE_API_URL is only whitespace", () => {
    expect(() =>
      validateEnv({ ...validEnv, VITE_API_URL: "   " }),
    ).toThrowError(/VITE_API_URL/);
  });

  it("throws a named error when VITE_API_URL is malformed", () => {
    expect(() =>
      validateEnv({ ...validEnv, VITE_API_URL: "localhost:3000/api" }),
    ).toThrowError(/VITE_API_URL.*(http|root-relative)/);
  });

  it("throws a named error when VITE_MSW is not true/false", () => {
    expect(() => validateEnv({ ...validEnv, VITE_MSW: "yes" })).toThrowError(
      /VITE_MSW/,
    );
  });

  it("throws a named error when VITE_STELLAR_NETWORK is unknown", () => {
    expect(() =>
      validateEnv({ ...validEnv, VITE_STELLAR_NETWORK: "devnet" }),
    ).toThrowError(/VITE_STELLAR_NETWORK/);
  });

  it("reports every invalid variable at once", () => {
    let error: unknown;

    try {
      validateEnv({ VITE_MSW: "yes", VITE_STELLAR_NETWORK: "devnet" });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(EnvValidationError);
    const message = (error as Error).message;

    expect(message).toContain("VITE_API_URL");
    expect(message).toContain("VITE_MSW");
    expect(message).toContain("VITE_STELLAR_NETWORK");
  });

  it("logs a clear, named console error before throwing", () => {
    const { VITE_API_URL: _missing, ...withoutApiUrl } = validEnv;

    try {
      validateEnv(withoutApiUrl);
    } catch {
      // expected
    }

    expect(consoleError).toHaveBeenCalledTimes(1);
    const logged = consoleError.mock.calls[0][0] as string;

    expect(logged).toContain("EnvValidationError");
    expect(logged).toContain("VITE_API_URL");
    expect(logged).toContain("missing");
  });

  it("names the error class for programmatic handling", () => {
    try {
      validateEnv({});
      expect.unreachable("validateEnv should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe("EnvValidationError");
    }
  });
});
