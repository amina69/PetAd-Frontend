import { describe, it, expect, afterEach, vi } from "vitest";
import {
  addDays,
  addMonths,
  countNights,
  dateOnlyToUtcMs,
  daysInMonth,
  diffInDays,
  eachDate,
  formatDateOnly,
  isDateOnly,
  parseDateOnly,
  startOfMonth,
  toDateOnly,
  todayDateOnly,
  weekdayIndex,
} from "../dateOnly";

/**
 * Runs `run` with the process time zone set to `timeZone`.
 *
 * Node re-reads `process.env.TZ` on every date operation, so the helper
 * below really does change the local time zone for the duration of the
 * callback.
 */
function withTimeZone(timeZone: string, run: () => void) {
  vi.stubEnv("TZ", timeZone);

  try {
    run();
  } finally {
    vi.unstubAllEnvs();
  }
}

/** Time zones with very different UTC offsets, incl. both DST edges. */
const TIME_ZONES = [
  "UTC",
  "Europe/Berlin",
  "America/New_York",
  "Asia/Tokyo",
  "Pacific/Kiritimati", // UTC+14
  "Pacific/Pago_Pago", // UTC-11
];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("dateOnly helpers", () => {
  it("recognises well-formed calendar dates", () => {
    expect(isDateOnly("2026-06-20")).toBe(true);
    expect(isDateOnly("2026-02-28")).toBe(true);
    expect(isDateOnly("2026-02-31")).toBe(false);
    expect(isDateOnly("2026-13-01")).toBe(false);
    expect(isDateOnly("2026-6-2")).toBe(false);
    expect(isDateOnly("20-06-2026")).toBe(false);
    expect(isDateOnly("")).toBe(false);
  });

  it("parses a date-only string as the same local day in every time zone", () => {
    for (const timeZone of TIME_ZONES) {
      withTimeZone(timeZone, () => {
        const parsed = parseDateOnly("2026-06-20");

        expect(parsed).not.toBeNull();
        expect(parsed?.getFullYear()).toBe(2026);
        expect(parsed?.getMonth()).toBe(5);
        expect(parsed?.getDate()).toBe(20);
      });
    }
  });

  it("rejects impossible dates instead of rolling them over", () => {
    expect(parseDateOnly("2026-02-31")).toBeNull();
    expect(parseDateOnly("not-a-date")).toBeNull();
  });

  it("does not shift the day the way new Date(string) does", () => {
    withTimeZone("America/New_York", () => {
      // `new Date("2026-06-20")` is UTC midnight — the previous day in New York.
      expect(new Date("2026-06-20").getDate()).toBe(19);
      expect(parseDateOnly("2026-06-20")?.getDate()).toBe(20);
    });
  });

  it("counts calendar days without an off-by-one across a DST change", () => {
    for (const timeZone of TIME_ZONES) {
      withTimeZone(timeZone, () => {
        // 8 March 2026 is the US "spring forward" day (23 hours long).
        expect(diffInDays("2026-03-07", "2026-03-09")).toBe(2);
        // 1 November 2026 is the US "fall back" day (25 hours long).
        expect(diffInDays("2026-10-31", "2026-11-02")).toBe(2);
        // 25 October 2026 is the EU "fall back" day.
        expect(diffInDays("2026-10-24", "2026-10-26")).toBe(2);
        // 29 March 2026 is the EU "spring forward" day.
        expect(diffInDays("2026-03-28", "2026-03-30")).toBe(2);
      });
    }
  });

  it("keeps a plain week exactly seven days long in every time zone", () => {
    for (const timeZone of TIME_ZONES) {
      withTimeZone(timeZone, () => {
        expect(diffInDays("2026-06-20", "2026-06-27")).toBe(7);
        expect(countNights("2026-06-20", "2026-06-27")).toBe(7);
        expect(diffInDays("2026-06-27", "2026-06-20")).toBe(-7);
      });
    }
  });

  it("adds days across a DST boundary without drifting", () => {
    for (const timeZone of TIME_ZONES) {
      withTimeZone(timeZone, () => {
        expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
        expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
        expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
        expect(addDays("2026-06-20", 7)).toBe("2026-06-27");
        expect(addDays("2026-06-20", -1)).toBe("2026-06-19");
      });
    }
  });

  it("lists every day of a range, inclusive", () => {
    expect(eachDate("2026-03-07", "2026-03-09")).toEqual([
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
    ]);
    expect(eachDate("2026-06-20", "2026-06-20")).toEqual(["2026-06-20"]);
    expect(eachDate("2026-06-27", "2026-06-20")).toEqual([]);
  });

  it("exposes a UTC calendar-day ordinal", () => {
    expect(dateOnlyToUtcMs("2026-06-20")).toBe(
      Date.UTC(2026, 5, 20),
    );
  });

  it("formats a date using the local calendar fields", () => {
    withTimeZone("Pacific/Kiritimati", () => {
      expect(toDateOnly(new Date(2026, 5, 20, 23, 30))).toBe("2026-06-20");
    });

    withTimeZone("Pacific/Pago_Pago", () => {
      expect(toDateOnly(new Date(2026, 5, 20, 0, 30))).toBe("2026-06-20");
    });
  });

  it("reports today from the local calendar fields", () => {
    withTimeZone("Pacific/Kiritimati", () => {
      expect(todayDateOnly(new Date(2026, 5, 20, 23, 30))).toBe("2026-06-20");
    });

    withTimeZone("Pacific/Pago_Pago", () => {
      expect(todayDateOnly(new Date(2026, 5, 20, 0, 30))).toBe("2026-06-20");
    });
  });

  it("provides month helpers", () => {
    expect(startOfMonth("2026-06-20")).toBe("2026-06-01");
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(addMonths("2026-06-01", 1)).toEqual({ year: 2026, month: 7 });
    expect(addMonths("2026-12-01", 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths("2026-01-01", -1)).toEqual({ year: 2025, month: 12 });
  });

  it("computes a Monday-based weekday index", () => {
    // 1 June 2026 is a Monday.
    expect(weekdayIndex("2026-06-01")).toBe(0);
    // 7 June 2026 is a Sunday.
    expect(weekdayIndex("2026-06-07")).toBe(6);
  });

  it("formats a date for display", () => {
    expect(formatDateOnly("2026-06-20")).toBe("20 Jun 2026");
  });
});
