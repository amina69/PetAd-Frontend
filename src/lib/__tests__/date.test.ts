import { afterEach, describe, expect, it, vi } from "vitest";
import {
  daysBetween,
  formatDate,
  formatDateTime,
  formatRelative,
  formatTime,
  getFirstDayOfWeek,
  isPast,
} from "../date";

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

    expect(formatRelative(new Date(now.getTime() - 10_000), "en-US", now)).toBe("now");
    expect(formatRelative(new Date(now.getTime() - 2 * 60 * 60 * 1000), "en-US", now)).toBe(
      "2 hours ago",
    );
    expect(formatRelative("2024-06-14", "en-US", now)).toBe("yesterday");
  });

  it("formats relative and clock values in the active locale", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    const now = new Date();

    expect(formatRelative(new Date(now.getTime() - 2 * 60 * 60 * 1000), "fr-FR", now)).toBe(
      "il y a 2 heures",
    );
    expect(formatTime("2024-06-15T15:30:00.000Z", "en-GB", "UTC")).toBe("15:30");
  });

  it("uses the locale's first day of week", () => {
    expect(getFirstDayOfWeek("en-GB")).toBe(1);
    expect(getFirstDayOfWeek("en-US")).toBe(0);
    expect(getFirstDayOfWeek("ar-EG")).toBe(6);
  });

  it("keeps the region's week start when Intl has no week info (Node 20)", () => {
    const prototype = Intl.Locale.prototype as { getWeekInfo?: () => { firstDay: number } };
    const original = prototype.getWeekInfo;
    prototype.getWeekInfo = undefined;

    try {
      expect(getFirstDayOfWeek("en-GB")).toBe(1);
      expect(getFirstDayOfWeek("en-US")).toBe(0);
      expect(getFirstDayOfWeek("fr-FR")).toBe(1);
      expect(getFirstDayOfWeek("pt-BR")).toBe(0);
      expect(getFirstDayOfWeek("ar-EG")).toBe(6);
    } finally {
      prototype.getWeekInfo = original;
    }
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
