import { afterEach, describe, expect, it, vi } from "vitest";
import { daysBetween, formatDate, formatDateTime, formatRelative, isPast } from "../date";

describe("date utilities", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats a date-only string on that calendar day in UTC and US time zones", () => {
    for (const timeZone of ["UTC", "America/New_York", "Pacific/Auckland"]) {
      const formatted = formatDate("2024-01-15", "en-US", timeZone);
      expect(formatted).toContain("15");
      expect(formatted).toContain("2024");
      expect(formatted).toContain("Jan");
    }
  });

  it("formats the same instant differently across time zones", () => {
    const instant = "2024-01-15T03:30:00.000Z";
    expect(formatDateTime(instant, "en-US", "UTC")).toContain("3:30");
    expect(formatDateTime(instant, "en-US", "America/Los_Angeles")).toContain("7:30");
  });

  it("formats relative labels against a fixed clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    const now = new Date();

    expect(formatRelative(new Date(now.getTime() - 10_000), now)).toBe("just now");
    expect(formatRelative(new Date(now.getTime() - 2 * 60 * 60 * 1000), now)).toBe("2h ago");
    expect(formatRelative("2024-06-14", now)).toBe("yesterday");
  });

  it("counts days between date-only strings and detects the past", () => {
    expect(daysBetween("2024-01-01", "2024-01-15")).toBe(14);
    expect(daysBetween("2024-01-15", "2024-01-01")).toBe(-14);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    expect(isPast("2024-06-14")).toBe(true);
    expect(isPast("2024-06-16")).toBe(false);
  });
});
