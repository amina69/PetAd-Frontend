import { describe, expect, it } from "vitest";
import { validateProfile } from "../validateProfile";

describe("validateProfile", () => {
  it("accepts a complete profile", () => {
    const result = validateProfile({
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+1 (555) 010-2000",
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("accepts a profile without a phone number", () => {
    expect(validateProfile({ displayName: "Ada", email: "ada@example.com" }).ok).toBe(true);
  });

  it("rejects a blank name, a long name, a bad email, and a bad phone", () => {
    expect(validateProfile({ displayName: "   ", email: "ada" }).errors.displayName).toMatch(/required/i);
    expect(
      validateProfile({ displayName: "a".repeat(81), email: "ada@example.com" }).errors.displayName,
    ).toMatch(/80/);
    expect(validateProfile({ displayName: "Ada", email: "not-an-email" }).errors.email).toMatch(/valid email/i);
    expect(
      validateProfile({ displayName: "Ada", email: "ada@example.com", phone: "12" }).errors.phone,
    ).toMatch(/phone/i);
  });
});
