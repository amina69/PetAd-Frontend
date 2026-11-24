import { useId } from "react";
import { useLocale } from "../../i18n";
import { getFirstDayOfWeek } from "../../lib/date";

export interface DateRange {
  from?: string;
  to?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

/**
 * Two native date inputs (YYYY-MM-DD) constrained so `to` is never before `from`.
 *
 * The wrapper carries the active locale so native pickers localise their month
 * and weekday labels. `data-week-start` exposes the locale's first day of the
 * week (0 = Sunday) for custom calendar surfaces that consume this component.
 */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const id = useId();
  const { locale, t } = useLocale();
  const weekStart = getFirstDayOfWeek(locale);
  const input =
    "rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-900";

  return (
    <div
      className="flex items-center gap-2"
      lang={locale}
      data-week-start={weekStart}
    >
      <label htmlFor={`${id}-from`} className="text-sm font-medium text-gray-700">
        {t("range.from")}
      </label>
      <input
        id={`${id}-from`}
        type="date"
        className={input}
        lang={locale}
        value={value.from ?? ""}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
      />
      <label htmlFor={`${id}-to`} className="text-sm font-medium text-gray-700">
        {t("range.to")}
      </label>
      <input
        id={`${id}-to`}
        type="date"
        className={input}
        lang={locale}
        value={value.to ?? ""}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
      />
    </div>
  );
}
