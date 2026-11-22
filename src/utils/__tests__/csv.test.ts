import { describe, expect, it } from "vitest";
import { neutralizeCsvCell, toCsv } from "../csv";

describe("csv", () => {
  it.each(["=SUM(A1)", "+1", "-2", "@cmd", "\tx"])("neutralises %j", (cell) => {
    expect(neutralizeCsvCell(cell)).toBe(`'${cell}`);
  });

  it("leaves safe strings and numbers alone", () => {
    expect(neutralizeCsvCell("hello")).toBe("hello");
    expect(neutralizeCsvCell(-5)).toBe("-5");
    expect(neutralizeCsvCell(null)).toBe("");
  });

  it("neutralises then quotes cells", () => {
    expect(toCsv(["a", "b"], [['=1,2', 'say "hi"']])).toBe('a,b\r\n"\'=1,2","say ""hi"""');
  });

  it("neutralises formulas inside serialised metadata only at the start", () => {
    expect(toCsv(["m"], [[{ a: "=1" }]])).toBe('m\r\n"{""a"":""=1""}"');
  });
});
