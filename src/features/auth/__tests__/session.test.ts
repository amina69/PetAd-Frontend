import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_TOKEN_KEY,
  PROFILE_CACHE_KEY,
  RETURN_PATH_KEY,
  ROLE_KEY,
  canAccessRole,
  clearAuthCache,
  consumeReturnPath,
  establishSession,
  readRole,
  rememberReturnPath,
} from "../session";

describe("auth session", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("remembers an in-app return path and ignores external paths", () => {
    rememberReturnPath("/account?tab=docs");
    expect(sessionStorage.getItem(RETURN_PATH_KEY)).toBe("/account?tab=docs");
    rememberReturnPath("https://evil.example");
    rememberReturnPath("//evil.example");
    expect(sessionStorage.getItem(RETURN_PATH_KEY)).toBe("/account?tab=docs");
  });

  it("consumes the return path once and falls back when it is missing or unsafe", () => {
    rememberReturnPath("/account");
    expect(consumeReturnPath()).toBe("/account");
    expect(sessionStorage.getItem(RETURN_PATH_KEY)).toBeNull();
    expect(consumeReturnPath("/home")).toBe("/home");

    sessionStorage.setItem(RETURN_PATH_KEY, "https://evil.example");
    expect(consumeReturnPath("/home")).toBe("/home");
  });

  it("allows only listed roles", () => {
    expect(canAccessRole(null, ["user"])).toBe(false);
    expect(canAccessRole("shelter", ["user", "admin"])).toBe(false);
    expect(canAccessRole("admin", ["user", "admin"])).toBe(true);
  });

  it("establishes a session and clears cached auth data on logout", () => {
    establishSession("admin");
    localStorage.setItem(PROFILE_CACHE_KEY, "{\"name\":\"Ada\"}");
    sessionStorage.setItem(AUTH_TOKEN_KEY, "session-copy");
    expect(readRole()).toBe("admin");

    clearAuthCache();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(ROLE_KEY)).toBeNull();
    expect(localStorage.getItem(PROFILE_CACHE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});
