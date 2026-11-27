import { useId, type ReactNode } from "react";
import { InlineError } from "../InlineError";

export interface FieldIds {
  /** Resolved control id (the provided one or a generated fallback). */
  id: string;
  hintId?: string;
  errorId?: string;
  /** Space-separated ids for `aria-describedby`. */
  describedBy?: string;
}

/**
 * Resolves the ids shared by every form control.
 *
 * Controls accept an explicit `id` (react-hook-form's `register`, storybook
 * stories and existing call sites all rely on it) and otherwise fall back to
 * `useId`, so a label/hint/error can always be associated with the control.
 */
export function useFieldIds(
  providedId: string | undefined,
  hint: ReactNode | undefined,
  error: string | undefined,
): FieldIds {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return { id, hintId, errorId, describedBy };
}

/** Joins generated and caller-supplied `aria-describedby` ids. */
export function mergeDescribedBy(
  generated: string | undefined,
  supplied: string | undefined,
): string | undefined {
  return [generated, supplied].filter(Boolean).join(" ") || undefined;
}

export interface FieldLabelProps {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

/** Visible field label with a non-colour required marker. */
export function FieldLabel({
  htmlFor,
  children,
  required = false,
  className,
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={["text-sm font-medium text-gray-700", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ms-1 text-red-600">
          *
        </span>
      ) : null}
    </label>
  );
}

export interface FieldMessagesProps {
  hint?: ReactNode;
  hintId?: string;
  error?: string;
  errorId?: string;
  className?: string;
}

/**
 * Hint and error text. Errors render through `InlineError`, which adds an icon
 * and `role="alert"` so the failure is not communicated by colour alone.
 */
export function FieldMessages({
  hint,
  hintId,
  error,
  errorId,
  className,
}: FieldMessagesProps) {
  if (!hint && !error) {
    return null;
  }

  return (
    <div className={["space-y-1", className].filter(Boolean).join(" ")}>
      {hint ? (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <div id={errorId}>
          <InlineError message={error} />
        </div>
      ) : null}
    </div>
  );
}

export interface FieldShellProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  hintId?: string;
  errorId?: string;
  labelClassName?: string;
  messagesClassName?: string;
  className?: string;
  children: ReactNode;
}

/** Stacked label + control + messages wrapper shared by Input/Textarea/Select. */
export function FieldShell({
  id,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  hintId,
  errorId,
  labelClassName,
  messagesClassName,
  className,
  children,
}: FieldShellProps) {
  return (
    <div
      className={["flex flex-col gap-1.5", className].filter(Boolean).join(" ")}
      data-disabled={disabled || undefined}
      data-invalid={error ? true : undefined}
    >
      {label ? (
        <FieldLabel
          htmlFor={id}
          required={required}
          className={labelClassName}
        >
          {label}
        </FieldLabel>
      ) : null}
      {children}
      <FieldMessages
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
        className={messagesClassName}
      />
    </div>
  );
}
