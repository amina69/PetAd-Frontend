const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DateInput = Date | string | number;

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

function zoneFor(input: DateInput, timeZone?: string): string | undefined {
  // Date-only strings are calendar dates. Forcing UTC keeps Jan 15 on Jan 15
  // in every zone, including when a caller passes `TZ` or a timeZone option.
  if (isDateOnly(input)) return "UTC";
  return timeZone;
}

export function formatDate(input: DateInput, locale = "en-US", timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: zoneFor(input, timeZone),
  }).format(toDate(input));
}

export function formatDateTime(input: DateInput, locale = "en-US", timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: zoneFor(input, timeZone),
  }).format(toDate(input));
}

/**
 * Compact relative label: "just now", "2h ago", "yesterday".
 * `now` is injectable so tests can pin the clock.
 */
export function formatRelative(input: DateInput, now: Date = new Date()): string {
  const target = toDate(input);
  const diffMs = target.getTime() - now.getTime();
  const absSec = Math.abs(diffMs) / 1000;
  const past = diffMs < 0;

  if (absSec < 45) return "just now";

  if (absSec < 3600) {
    const minutes = Math.max(1, Math.round(absSec / 60));
    return past ? `${minutes}m ago` : `in ${minutes}m`;
  }

  if (absSec < 86400) {
    const hours = Math.max(1, Math.round(absSec / 3600));
    return past ? `${hours}h ago` : `in ${hours}h`;
  }

  const dayDiff = calendarDaysBetween(now, target);
  if (dayDiff === -1) return "yesterday";
  if (dayDiff === 1) return "tomorrow";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(dayDiff, "day");
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
