import {
  forwardRef,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { FieldShell, mergeDescribedBy, useFieldIds } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Declarative options. Ignored when `children` is supplied. */
  options?: readonly SelectOption[];
  /** Rendered as a disabled placeholder option with an empty value. */
  placeholder?: string;
  containerClassName?: string;
  labelClassName?: string;
  children?: ReactNode;
}

const BASE_CLASSES =
  "w-full appearance-none rounded-xl border bg-white px-4 py-3 pe-10 text-sm text-gray-900 outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

/**
 * Native select element wrapped with label/hint/error semantics. Using a
 * native `<select>` keeps the platform picker, keyboard behaviour and
 * react-hook-form compatibility for free.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      hint,
      error,
      options,
      placeholder,
      required = false,
      disabled = false,
      id,
      className,
      containerClassName,
      labelClassName,
      children,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const ids = useFieldIds(id, hint, error);

    return (
      <FieldShell
        id={ids.id}
        label={label}
        hint={hint}
        error={error}
        required={required}
        disabled={disabled}
        hintId={ids.hintId}
        errorId={ids.errorId}
        labelClassName={labelClassName}
        className={containerClassName}
      >
        <div className="relative">
          <select
            {...props}
            ref={ref}
            id={ids.id}
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={mergeDescribedBy(ids.describedBy, ariaDescribedBy)}
            className={[
              BASE_CLASSES,
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                : "border-gray-200 focus:border-[#E84D2A] focus:ring-[#E84D2A]/20",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {children ??
              options?.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
          </svg>
        </div>
      </FieldShell>
    );
  },
);
