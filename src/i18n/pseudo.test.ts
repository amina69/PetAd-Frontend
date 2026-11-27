import { describe, expect, it } from "vitest";
import { pseudoLocalise } from "./pseudo";

describe("pseudoLocalise", () => {
  it("accents vowels and expands longer messages by approximately 40 percent", () => {
    const original = "Welcome Pet Lover!";
    const expanded = pseudoLocalise(original);
    expect(expanded).toContain("Wélcômé Pét Lôvér!");
    expect(expanded.length).toBe(Math.round(original.length * 1.4));
  });

  it("preserves empty strings and numbers", () => {
    expect(pseudoLocalise("")).toBe("");
    expect(pseudoLocalise("20 unread")).toContain("20 ûnréàd");
  });
});
