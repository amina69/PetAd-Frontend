import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { FieldShell, mergeDescribedBy, useFieldIds } from "./Field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const BASE_CLASSES =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

/**
 * Text input with a uniform label/hint/error API.
 *
 * Native `input` attributes (`name`, `onChange`, `onBlur`, `ref`, …) pass
 * straight through, so the control works unchanged with react-hook-form's
 * `register` or `Controller`.
 *
 * @example
 * <Input label="Email" type="email" hint="We never share it." error={errors.email} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    required = false,
    disabled = false,
    id,
    className,
    containerClassName,
    labelClassName,
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
      <input
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
      />
    </FieldShell>
  );
});
