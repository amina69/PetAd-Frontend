interface InlineErrorProps {
  message: string;
  field?: string;
}

/**
 * Consistent inline error display for form fields and mutation errors.
 * When `field` is provided, renders with `id="{field}-error"` so the
 * associated input can reference it via `aria-describedby`.
 *
 * @example
 * // Basic mutation error
 * <InlineError message="Something went wrong" />
 *
 * @example
 * // Form field error with ARIA association
 * <input aria-describedby="email-error" ... />
 * <InlineError field="email" message="Email is required" />
 */
export function InlineError({ message, field }: InlineErrorProps) {
  return (
    <p
      role="alert"
      id={field ? `${field}-error` : undefined}
      className="flex items-center gap-1.5 text-xs text-red-500 mt-1"
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {message}
    </p>
  );
}