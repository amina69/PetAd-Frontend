import { useId } from "react";

export interface DateRange {
  from?: string;
  to?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

/** Two native date inputs (YYYY-MM-DD) constrained so `to` is never before `from`. */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const id = useId();
  const input =
    "rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-900";

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`${id}-from`} className="text-sm font-medium text-gray-700">
        From
      </label>
      <input
        id={`${id}-from`}
        type="date"
        className={input}
        value={value.from ?? ""}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
      />
      <label htmlFor={`${id}-to`} className="text-sm font-medium text-gray-700">
        To
      </label>
      <input
        id={`${id}-to`}
        type="date"
        className={input}
        value={value.to ?? ""}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
      />
    </div>
  );
}
