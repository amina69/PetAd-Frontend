/**
 * Calendar-date helpers that never involve a time component.
 *
 * Everything in this module works on **date-only strings**
 * (`"YYYY-MM-DD"`). A custody period is a range of calendar days, not a
 * range of instants, so the helpers below deliberately avoid `new Date(str)`
 * for date-only input: `new Date("2026-06-20")` is parsed as *UTC* midnight,
 * which is the previous day for anybody west of Greenwich and therefore the
 * classic source of an off-by-one bug.
 *
 * Day arithmetic is done on UTC midnights (a pure calendar-day ordinal), so
 * a daylight-saving switch can never shorten or lengthen a day.
 */

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** A calendar date without a time component, e.g. `"2026-06-20"`. */
export type DateOnly = string;

/** `true` when `value` is a well-formed `YYYY-MM-DD` calendar date. */
export function isDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  // Rejects impossible dates such as "2026-02-31".
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Formats a `Date` as a date-only string using its **local** calendar
 * fields — the day the user actually sees on their wall clock.
 */
export function toDateOnly(date: Date): DateOnly {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Today as a date-only string, in the user's local time zone. */
export function todayDateOnly(now: Date = new Date()): DateOnly {
  return toDateOnly(now);
}

/**
 * Parses a date-only string into a `Date` anchored at **local** midnight.
 *
 * Returns `null` for anything that is not a valid calendar date.
 */
export function parseDateOnly(value: DateOnly): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // Rejects impossible dates such as "2026-02-31" (JS rolls them over).
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * The number of milliseconds between the *calendar* midnights of two
 * date-only strings.
 *
 * The result is an exact multiple of a day, whatever the local time zone is.
 */
export function dateOnlyToUtcMs(value: DateOnly): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * The number of calendar days between two dates (`to - from`).
 *
 * The result is negative when `to` is before `from`.
 */
export function diffInDays(from: DateOnly, to: DateOnly): number {
  return Math.round(
    (dateOnlyToUtcMs(to) - dateOnlyToUtcMs(from)) / MS_PER_DAY,
  );
}

/** Adds (or subtracts) whole calendar days to a date-only string. */
export function addDays(value: DateOnly, days: number): DateOnly {
  const timestamp = dateOnlyToUtcMs(value) + days * MS_PER_DAY;
  return toDateOnlyUtc(new Date(timestamp));
}

/** Formats a `Date` as a date-only string using its **UTC** fields. */
export function toDateOnlyUtc(date: Date): DateOnly {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Every calendar day from `from` to `to`, inclusive. */
export function eachDate(from: DateOnly, to: DateOnly): DateOnly[] {
  const days = diffInDays(from, to);
  if (days < 0) return [];

  return Array.from({ length: days + 1 }, (_, index) => addDays(from, index));
}

/**
 * The number of nights between two dates.
 *
 * A custody period from the 20th to the 27th is 7 nights long.
 */
export function countNights(from: DateOnly, to: DateOnly): number {
  return diffInDays(from, to);
}

/** The first day of the month a date-only string falls in. */
export function startOfMonth(value: DateOnly): DateOnly {
  const [year, month] = value.split("-").map(Number);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

/** The year and month (1-12) a date-only string falls in. */
export function yearMonth(value: DateOnly): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

/** Adds (or subtracts) whole months to the first day of a month. */
export function addMonths(
  value: DateOnly,
  months: number,
): { year: number; month: number } {
  const { year, month } = yearMonth(value);
  const zeroBased = month - 1 + months;
  const normalizedYear = year + Math.floor(zeroBased / 12);
  const normalizedMonth = ((zeroBased % 12) + 12) % 12;

  return { year: normalizedYear, month: normalizedMonth + 1 };
}

/** The number of days in a given month (1-12) of a given year. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The Monday-based weekday index of a date-only string (0 = Monday …
 * 6 = Sunday).
 */
export function weekdayIndex(value: DateOnly): number {
  const date = parseDateOnly(value);
  if (!date) return 0;

  return (date.getDay() + 6) % 7;
}

/** Formats a date-only string for display, e.g. "20 Jun 2026". */
export function formatDateOnly(
  value: DateOnly,
  locale = "en-GB",
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  const date = parseDateOnly(value);
  if (!date) return value;

  return new Intl.DateTimeFormat(locale, options).format(date);
}
