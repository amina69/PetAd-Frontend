import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { FieldMessages, mergeDescribedBy, useFieldIds } from "./Field";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
}

/**
 * Native checkbox with a clickable label, hint and error text. The control is
 * a real `<input type="checkbox">`, so `register`/`Controller` and native form
 * submission work without adapters.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
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
        <div className="flex items-start gap-2.5">
          <input
            {...props}
            ref={ref}
            type="checkbox"
            id={ids.id}
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={mergeDescribedBy(ids.describedBy, ariaDescribedBy)}
            className={[
              "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/40 disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-red-400 text-red-600" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <label
            htmlFor={ids.id}
            className={[
              "text-sm text-gray-700",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            {label}
            {required ? (
              <span aria-hidden="true" className="ms-1 text-red-600">
                *
              </span>
            ) : null}
          </label>
        </div>
        <div className="ms-[1.625rem]">
          <FieldMessages
            hint={hint}
            hintId={ids.hintId}
            error={error}
            errorId={ids.errorId}
          />
        </div>
      </div>
    );
  },
);
