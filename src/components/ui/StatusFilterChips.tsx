import React, { useEffect } from "react";
import { useUrlSync } from "../../hooks/useUrlSync";

export interface Option {
  value: string;
  label: string;
}

interface StatusFilterChipsProps {
  options: Option[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

export const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({
  options,
  value = [],
  onChange,
}) => {
  const [urlState, setUrlState] = useUrlSync<{ status: string[] }>({
    status: [],
  });

  const selected = value.length ? value : urlState.status || [];

  // Sync external value → URL
  useEffect(() => {
    if (value) {
      setUrlState({ status: value });
    }
  }, [value, setUrlState]);

  const update = (next: string[]) => {
    setUrlState({ status: next });
    onChange?.(next);
  };

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      update(selected.filter((v) => v !== val));
    } else {
      update([...selected, val]);
    }
  };

  const clearAll = () => update([]);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Filter by status"
        className="flex flex-wrap gap-2"
      >
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);

          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(opt.value)}
              className={[
                "px-3 py-1 rounded-full text-sm transition",
                isSelected
                  ? "bg-[#E84D2A] text-white"
                  : "border border-[#E84D2A] text-[#E84D2A] bg-white hover:bg-[#FFF2E5]",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <button
          onClick={clearAll}
          className="text-sm text-[#E84D2A] underline w-fit"
        >
          Clear all
        </button>
      )}
    </div>
  );
};