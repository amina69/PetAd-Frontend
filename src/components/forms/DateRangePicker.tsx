import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  addDays,
  addMonths,
  countNights,
  daysInMonth,
  diffInDays,
  eachDate,
  formatDateOnly,
  isDateOnly,
  startOfMonth,
  todayDateOnly,
  weekdayIndex,
  yearMonth,
  type DateOnly,
} from "../../lib/dateOnly";

/**
 * A selected range of calendar days.
 *
 * Both ends are date-only strings (`"YYYY-MM-DD"`) — a custody period is a
 * range of days, not a range of instants.
 */
export interface DateRange {
  startDate: DateOnly | null;
  endDate: DateOnly | null;
}

export interface DateRangePickerProps {
  /** The currently selected range. */
  value: DateRange;
  /** Called whenever the selection changes. */
  onChange: (value: DateRange) => void;
  /**
   * Dates the API reported as unavailable. They are rendered as disabled and
   * a range that would cross one of them is rejected.
   */
  unavailableDates?: DateOnly[];
  /** Earliest selectable day (defaults to today). */
  minDate?: DateOnly;
  /** Latest selectable day. */
  maxDate?: DateOnly;
  /** Disables the whole picker. */
  disabled?: boolean;
  /** Id of the element labelling the grid. */
  id?: string;
  /** Label rendered above the grid. */
  label?: string;
  /** Hint rendered under the grid. */
  hint?: string;
  /** Error message rendered under the grid (also announced). */
  error?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * DateRangePicker — a keyboard-accessible calendar range picker.
 *
 * - Arrow keys move the focus by a day/week, `PageUp`/`PageDown` change the
 *   month, `Home`/`End` jump to the start/end of the week.
 * - Past days and days the API reported as unavailable are disabled.
 * - A range that would cross an unavailable day is rejected with an
 *   explanatory message.
 * - The number of nights in the selected range is shown.
 *
 * All dates are handled as date-only strings, so a daylight-saving switch or
 * a UTC offset can never shift a day.
 */
export function DateRangePicker({
  value,
  onChange,
  unavailableDates = [],
  minDate,
  maxDate,
  disabled = false,
  id = "date-range-picker",
  label = "Custody period",
  hint,
  error,
}: DateRangePickerProps) {
  const today = todayDateOnly();
  const earliest = minDate ?? today;

  const unavailable = useMemo(
    () => new Set(unavailableDates.filter(isDateOnly)),
    [unavailableDates],
  );

  const [view, setView] = useState(() => {
    const anchor = value.startDate ?? earliest;
    return yearMonth(isDateOnly(anchor) ? anchor : earliest);
  });

  const [focusedDate, setFocusedDate] = useState<DateOnly>(
    value.startDate ?? earliest,
  );

  const [rangeError, setRangeError] = useState<string | null>(null);

  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Only steal the DOM focus when the user moved it with the keyboard.
  const shouldFocusRef = useRef(false);

  // Keep the visible month in step with an externally controlled selection.
  useEffect(() => {
    if (!value.startDate || !isDateOnly(value.startDate)) return;

    setView(yearMonth(value.startDate));
    setFocusedDate(value.startDate);
  }, [value.startDate]);

  // Move the DOM focus whenever the focused day changes.
  useEffect(() => {
    if (!shouldFocusRef.current) return;

    shouldFocusRef.current = false;
    buttonRefs.current[focusedDate]?.focus();
  }, [focusedDate, view]);

  /** `true` when `date` is strictly before `other`. */
  const isBefore = (date: DateOnly, other: DateOnly) =>
    diffInDays(date, other) > 0;

  const isSelectable = (date: DateOnly) => {
    if (!isDateOnly(date)) return false;
    if (isBefore(date, earliest)) return false;
    if (maxDate && isBefore(maxDate, date)) return false;
    if (unavailable.has(date)) return false;

    return true;
  };

  const weeks = useMemo(() => {
    const first = `${view.year}-${String(view.month).padStart(2, "0")}-01`;
    const total = daysInMonth(view.year, view.month);
    const leading = weekdayIndex(first);

    const cells: (DateOnly | null)[] = Array.from(
      { length: leading },
      () => null,
    );

    for (let day = 1; day <= total; day += 1) {
      cells.push(
        `${view.year}-${String(view.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }

    // Pad the last week so every row holds seven cells.
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const result: (DateOnly | null)[][] = [];
    for (let index = 0; index < cells.length; index += 7) {
      result.push(cells.slice(index, index + 7));
    }

    return result;
  }, [view]);

  const selectedDays = useMemo(() => {
    if (!value.startDate) return new Set<DateOnly>();
    if (!value.endDate) return new Set<DateOnly>([value.startDate]);

    return new Set(eachDate(value.startDate, value.endDate));
  }, [value.startDate, value.endDate]);

  const nights =
    value.startDate && value.endDate
      ? countNights(value.startDate, value.endDate)
      : null;

  const selectDate = (date: DateOnly) => {
    if (!isSelectable(date)) return;

    // A completed range (or no range at all) starts a new selection.
    if (!value.startDate || value.endDate) {
      setRangeError(null);
      onChange({ startDate: date, endDate: null });
      return;
    }

    // Clicking before the start restarts the range.
    if (diffInDays(value.startDate, date) < 0) {
      setRangeError(null);
      onChange({ startDate: date, endDate: null });
      return;
    }

    // The range must not cross a day the API reported as unavailable.
    const blocked = eachDate(value.startDate, date).filter((day) =>
      unavailable.has(day),
    );

    if (blocked.length > 0) {
      setRangeError(
        `The selected period includes ${blocked
          .map((day) => formatDateOnly(day))
          .join(", ")}, which ${
          blocked.length === 1 ? "is" : "are"
        } not available. Pick another end date.`,
      );
      return;
    }

    setRangeError(null);
    onChange({ startDate: value.startDate, endDate: date });
  };

  const moveFocus = (date: DateOnly) => {
    if (!isDateOnly(date)) return;

    shouldFocusRef.current = true;
    setFocusedDate(date);

    const target = yearMonth(date);
    if (target.year !== view.year || target.month !== view.month) {
      setView(target);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    date: DateOnly,
  ) => {
    const keyActions: Record<string, () => void> = {
      ArrowLeft: () => moveFocus(addDays(date, -1)),
      ArrowRight: () => moveFocus(addDays(date, 1)),
      ArrowUp: () => moveFocus(addDays(date, -7)),
      ArrowDown: () => moveFocus(addDays(date, 7)),
      Home: () => {
        const weekday = weekdayIndex(date);
        moveFocus(addDays(date, -weekday));
      },
      End: () => {
        const weekday = weekdayIndex(date);
        moveFocus(addDays(date, 6 - weekday));
      },
      PageUp: () => {
        const previous = addMonths(startOfMonth(date), -1);
        moveFocus(`${previous.year}-${String(previous.month).padStart(2, "0")}-01`);
      },
      PageDown: () => {
        const next = addMonths(startOfMonth(date), 1);
        moveFocus(`${next.year}-${String(next.month).padStart(2, "0")}-01`);
      },
    };

    const action = keyActions[event.key];
    if (!action) return;

    event.preventDefault();
    action();
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(
      `${view.year}-${String(view.month).padStart(2, "0")}-01`,
      delta,
    );
    setView(next);
  };

  const message = error ?? rangeError;

  return (
    <div className="flex flex-col gap-2" data-testid="date-range-picker">
      <div className="flex items-center justify-between">
        <span id={`${id}-label`} className="text-sm font-medium text-gray-700">
          {label}
        </span>
        <span className="text-xs text-gray-500" data-testid="date-range-nights">
          {nights === null
            ? "Select a start and an end date"
            : `${nights} ${nights === 1 ? "night" : "nights"}`}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={disabled}
          aria-label="Previous month"
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 disabled:opacity-40"
        >
          ‹
        </button>

        <span
          className="text-sm font-semibold text-gray-900"
          aria-live="polite"
          data-testid="date-range-view-month"
        >
          {MONTH_NAMES[view.month - 1]} {view.year}
        </span>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={disabled}
          aria-label="Next month"
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 disabled:opacity-40"
        >
          ›
        </button>
      </div>

      <div
        role="grid"
        id={id}
        aria-labelledby={`${id}-label`}
        aria-disabled={disabled || undefined}
        className="grid grid-cols-7 gap-1"
      >
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            role="columnheader"
            aria-label={weekday}
            className="py-1 text-center text-xs font-medium text-gray-500"
          >
            {weekday}
          </div>
        ))}

        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} role="row" className="contents">
            {week.map((date, dayIndex) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${weekIndex}-${dayIndex}`}
                    role="gridcell"
                  />
                );
              }

              const selectable = isSelectable(date);
              const isSelected = selectedDays.has(date);
              const isStart = value.startDate === date;
              const isEnd = value.endDate === date;
              const isUnavailable = unavailable.has(date);
              const isPast = isBefore(date, earliest);

              return (
                <div key={date} role="gridcell">
                  <button
                    type="button"
                    ref={(node) => {
                      buttonRefs.current[date] = node;
                    }}
                    disabled={disabled || !selectable}
                    aria-pressed={isSelected}
                    aria-label={`${formatDateOnly(date)}${
                      isUnavailable ? " (unavailable)" : ""
                    }${isPast ? " (in the past)" : ""}`}
                    data-testid={`date-${date}`}
                    data-selected={isSelected || undefined}
                    data-unavailable={isUnavailable || undefined}
                    onClick={() => selectDate(date)}
                    onKeyDown={(event) => handleKeyDown(event, date)}
                    className={[
                      "h-9 w-full rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-[#E84D2A] font-semibold text-white"
                        : "text-gray-800 hover:bg-gray-100",
                      !selectable
                        ? "cursor-not-allowed text-gray-300 line-through"
                        : "",
                      isStart || isEnd
                        ? "ring-2 ring-[#E84D2A] ring-offset-1"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {Number(date.slice(-2))}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {hint && !message && (
        <p className="text-xs text-gray-500" data-testid="date-range-hint">
          {hint}
        </p>
      )}

      {message && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-red-500"
          data-testid="date-range-error"
        >
          {message}
        </p>
      )}
    </div>
  );
}

export type { DateOnly };
