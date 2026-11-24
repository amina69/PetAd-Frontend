const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DateInput = Date | string | number;

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DEFAULT_DATE_OPTIONS,
  hour: "numeric",
  minute: "2-digit",
};

const DEFAULT_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

function isDateOnly(input: DateInput): input is string {
  return typeof input === "string" && DATE_ONLY.test(input);
}

/** Calendar date, or an instant. Date-only strings stay on that calendar day. */
export function toDate(input: DateInput): Date {
  if (isDateOnly(input)) {
    const [, year, month, day] = DATE_ONLY.exec(input) ?? [];
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }
  return input instanceof Date ? input : new Date(input);
}

function zoneFor(
  input: DateInput,
  timeZone?: string,
  options?: Intl.DateTimeFormatOptions,
): string | undefined {
  // Date-only strings are calendar dates. Forcing UTC keeps Jan 15 on Jan 15
  // in every zone, including when a caller passes `TZ` or a timeZone option.
  if (isDateOnly(input)) return "UTC";
  return timeZone ?? options?.timeZone;
}

/**
 * Format a calendar date using the active locale.
 *
 * Callers should pass the locale from `useLocale()`; the `en-US` default only
 * exists so non-UI helpers stay usable without a provider.
 */
export function formatDate(
  input: DateInput,
  locale = "en-US",
  timeZone?: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: zoneFor(input, timeZone, options),
  }).format(toDate(input));
}

/** Format a date and time of day using the active locale. */
export function formatDateTime(
  input: DateInput,
  locale = "en-US",
  timeZone?: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_TIME_OPTIONS,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: zoneFor(input, timeZone, options),
  }).format(toDate(input));
}

/** Format only the time of day using the active locale. */
export function formatTime(
  input: DateInput,
  locale = "en-US",
  timeZone?: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_TIME_OPTIONS,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: zoneFor(input, timeZone, options),
  }).format(toDate(input));
}

/**
 * Relative label such as "2 hours ago" / "il y a 2 heures".
 *
 * Delegates to `Intl.RelativeTimeFormat`, so both the words and the plural
 * rules come from the active locale. `now` is injectable for tests.
 */
export function formatRelative(
  input: DateInput,
  locale = "en-US",
  now: Date = new Date(),
): string {
  const target = toDate(input);
  if (Number.isNaN(target.getTime())) return "";

  const diffMs = target.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absMs < 45_000) return rtf.format(0, "second");

  if (absMs < 3_600_000) {
    return rtf.format(Math.round(diffMs / 60_000), "minute");
  }

  if (absMs < 86_400_000) {
    return rtf.format(Math.round(diffMs / 3_600_000), "hour");
  }

  return rtf.format(calendarDaysBetween(now, target), "day");
}

function utcDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
}

/** Whole calendar days from `start` to `end`. Date-only strings do not shift. */
export function daysBetween(start: DateInput, end: DateInput): number {
  return utcDayNumber(toDate(end)) - utcDayNumber(toDate(start));
}

function calendarDaysBetween(start: Date, end: Date): number {
  return utcDayNumber(end) - utcDayNumber(start);
}

export function isPast(input: DateInput, now: Date = new Date()): boolean {
  return toDate(input).getTime() < now.getTime();
}

/**
 * Week start for a locale, as a `Date#getDay()` index (0 = Sunday).
 *
 * Uses the platform's CLDR data when available (`Intl.Locale#getWeekInfo`,
 * supported in modern V8/WebKit) and falls back to a small map for older
 * engines. Date range calendars must use this instead of assuming Monday.
 */
export function getFirstDayOfWeek(locale: string): number {
  try {
    const LocaleCtor = Intl.Locale as unknown as new (
      tag: string,
    ) => { getWeekInfo?: () => { firstDay?: number } };
    const info = new LocaleCtor(locale).getWeekInfo?.();
    if (typeof info?.firstDay === "number") {
      // CLDR: 1 = Monday … 7 = Sunday. Convert to Date#getDay()'s 0 = Sunday.
      return info.firstDay % 7;
    }
  } catch {
    // Unknown/invalid locale or runtime without week info: use the fallback.
  }

  const language = locale.split("-")[0]?.toLowerCase() ?? "";
  const fallback: Record<string, number> = {
    ar: 6,
    en: 0,
    es: 1,
    fr: 1,
    pt: 0,
  };

  return fallback[language] ?? 1;
}
