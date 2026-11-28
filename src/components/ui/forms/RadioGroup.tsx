import {
  forwardRef,
  type FieldsetHTMLAttributes,
  type ReactNode,
} from "react";
import { FieldMessages, mergeDescribedBy, useFieldIds } from "./Field";

export interface RadioOption {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  label: ReactNode;
  name: string;
  options: readonly RadioOption[];
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onChange?: (value: string) => void;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  orientation?: "vertical" | "horizontal";
  legendClassName?: string;
}

/**
 * Radio group rendered as a `<fieldset>` with a `<legend>`. Native radios keep
 * browser arrow-key navigation; the legend, hint and error are associated with
 * the group so assistive tech announces all three.
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  function RadioGroup(
    {
      label,
      name,
      options,
      value,
      defaultValue,
      onChange,
      hint,
      error,
      required = false,
      orientation = "vertical",
      id,
      className,
      legendClassName,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const ids = useFieldIds(id, hint, error);
    const describedBy = mergeDescribedBy(ids.describedBy, ariaDescribedBy);

    return (
      <fieldset
        {...props}
        ref={ref}
        id={ids.id}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        data-invalid={error ? true : undefined}
        className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}
      >
        <legend
          className={["text-sm font-medium text-gray-700", legendClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="ms-1 text-red-600">
              *
            </span>
          ) : null}
        </legend>

        <div
          className={[
            "flex gap-3",
            orientation === "horizontal"
              ? "flex-row flex-wrap items-center"
              : "flex-col",
          ].join(" ")}
        >
          {options.map((option) => {
            const optionId = `${ids.id}-${option.value}`;
            const optionHintId = option.hint ? `${optionId}-hint` : undefined;

            return (
              <div key={option.value} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    id={optionId}
                    name={name}
                    value={option.value}
                    disabled={option.disabled}
                    required={required}
                    checked={value !== undefined ? value === option.value : undefined}
                    defaultChecked={
                      value === undefined ? defaultValue === option.value : undefined
                    }
                    aria-invalid={error ? true : undefined}
                    aria-describedby={
                      [describedBy, optionHintId].filter(Boolean).join(" ") ||
                      undefined
                    }
                    onChange={(event) => {
                      if (event.target.checked) {
                        onChange?.(option.value);
                      }
                    }}
                    className={[
                      "h-4 w-4 shrink-0 border-gray-300 text-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/40 disabled:cursor-not-allowed disabled:opacity-50",
                      error ? "border-red-400" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <label
                    htmlFor={optionId}
                    className={[
                      "text-sm text-gray-700",
                      option.disabled
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer",
                    ].join(" ")}
                  >
                    {option.label}
                  </label>
                </div>
                {option.hint ? (
                  <p id={optionHintId} className="ms-[1.625rem] text-xs text-gray-500">
                    {option.hint}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <FieldMessages
          hint={hint}
          hintId={ids.hintId}
          error={error}
          errorId={ids.errorId}
        />
      </fieldset>
    );
  },
);
