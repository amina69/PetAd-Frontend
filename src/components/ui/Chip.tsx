import type { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import type { BadgeTone } from "./Badge";

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "onClick"> {
  children: ReactNode;
  /** Semantic colour tone. Defaults to `"gray"`. */
  tone?: BadgeTone;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Toggle pressed/selected styling for filter chips. */
  selected?: boolean;
  /** Disables both click and remove interactions. */
  disabled?: boolean;
  /** Optional click handler for selectable/interactive chips. */
  onClick?: () => void;
  /** When provided, renders a remove button with an accessible label. */
  onRemove?: () => void;
  /** Accessible `aria-label` for the remove button. */
  removeLabel?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  gray: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",
  blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  teal: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
  green: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  amber: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  red: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
};

/**
 * Compact tag/filter chip primitive with optional selection and accessible
 * removal button.
 */
export function Chip({
  children,
  tone = "gray",
  icon,
  selected = false,
  disabled = false,
  onClick,
  onRemove,
  removeLabel,
  className,
  ...spanProps
}: ChipProps) {
  const resolvedRemoveLabel =
    removeLabel ??
    (typeof children === "string" && children.trim().length > 0
      ? `Remove ${children.trim()}`
      : "Remove");

  const containerClasses = [
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium leading-none transition-colors",
    TONE_CLASSES[tone],
    selected ? "ring-2 ring-slate-900/20 dark:ring-white/30" : "",
    disabled ? "opacity-50 pointer-events-none" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span data-selected={selected ? "true" : "false"} className={containerClasses} {...spanProps}>
      {onClick ? (
        <button
          type="button"
          disabled={disabled}
          aria-pressed={selected}
          onClick={onClick}
          className="inline-flex items-center gap-1.5 bg-transparent p-0 text-inherit focus:outline-none"
        >
          {icon ? (
            <span aria-hidden="true" className="inline-flex items-center">
              {icon}
            </span>
          ) : null}
          <span>{children}</span>
        </button>
      ) : (
        <>
          {icon ? (
            <span aria-hidden="true" className="inline-flex items-center">
              {icon}
            </span>
          ) : null}
          <span>{children}</span>
        </>
      )}

      {onRemove ? (
        <button
          type="button"
          disabled={disabled}
          aria-label={resolvedRemoveLabel}
          onClick={onRemove}
          className="ms-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}
