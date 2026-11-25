import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../money";

describe("money utilities", () => {
  it("formats numbers with the locale's separators and grouping", () => {
    expect(formatNumber(1234.5, "en-US")).toBe("1,234.5");
    expect(formatNumber(1234.5, "fr-FR")).toMatch(/^1.234,5$/);
  });

  it("formats ISO currencies with the locale's symbol placement", () => {
    expect(formatCurrency(1234.5, "USD", "en-US")).toBe("$1,234.50");
    expect(formatCurrency(1234.5, "EUR", "fr-FR")).toContain("1");
    expect(formatCurrency(1234.5, "EUR", "fr-FR")).toContain("€");
  });

  it("falls back to a code prefix for non-ISO asset codes", () => {
    expect(formatCurrency(12.5, "NOTACURRENCY", "en-US")).toBe(
      "NOTACURRENCY 12.5",
    );
  });

  it("formats token amounts with up to seven decimal places", () => {
    expect(formatAmount(12.5, "en-US")).toBe("12.50");
    expect(formatAmount(0.123456789, "en-US")).toBe("0.1234568");
  });

  it("formats ratios as locale-aware percentages", () => {    expect(formatPercent(0.256, "en-US")).toBe("25.6%");
    expect(formatPercent(0.256, "fr-FR")).toMatch(/^25,6.%$/);
  });
});
