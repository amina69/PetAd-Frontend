import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { FieldMessages, mergeDescribedBy, useFieldIds } from "./Field";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
}

/**
 * On/off switch built on a native checkbox with `role="switch"`. Keeping the
 * native input means it participates in form submission, works with
 * react-hook-form and is toggled with Space/Enter by the browser.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  function Switch(
    {
      label,
      hint,
      error,
      required = false,
      disabled = false,
      id,
      className,
      containerClassName,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const ids = useFieldIds(id, hint, error);

    return (
      <div
        className={["flex flex-col gap-1", containerClassName]
          .filter(Boolean)
          .join(" ")}
        data-invalid={error ? true : undefined}
      >
        <label
          htmlFor={ids.id}
          className={[
            "inline-flex items-center gap-3",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          ].join(" ")}
        >
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
            <input
              {...props}
              ref={ref}
              type="checkbox"
              role="switch"
              id={ids.id}
              required={required}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={mergeDescribedBy(ids.describedBy, ariaDescribedBy)}
              className={[
                "peer sr-only",
                "focus-visible:outline-none",
                className,
              ]
                .filter(Boolean)
                .join(" ")}
            />
            <span
              aria-hidden="true"
              className={[
                "absolute inset-0 rounded-full bg-gray-300 transition-colors",
                "peer-checked:bg-[#E84D2A] peer-focus-visible:ring-2 peer-focus-visible:ring-[#E84D2A] peer-focus-visible:ring-offset-2",
                error ? "bg-red-200 ring-1 ring-red-400" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute start-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
            />
          </span>
          <span className="text-sm text-gray-700">
            {label}
            {required ? (
              <span aria-hidden="true" className="ms-1 text-red-600">
                *
              </span>
            ) : null}
          </span>
        </label>
        <FieldMessages
          hint={hint}
          hintId={ids.hintId}
          error={error}
          errorId={ids.errorId}
        />
      </div>
    );
  },
);
