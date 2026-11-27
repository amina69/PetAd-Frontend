import type { HTMLAttributes, ReactNode } from "react";
import type { StatusColorToken } from "../../lib/statusConfig";

export type BadgeTone = StatusColorToken;
export type BadgeSize = "sm" | "md";

type BadgeSpanProps = Omit<HTMLAttributes<HTMLSpanElement>, "color">;

export interface BadgeProps extends BadgeSpanProps {
  /** Semantic colour token mapped to the CSS custom properties in `src/index.css`. */
  tone?: BadgeTone;
  /** Size variant. `"md"` matches the standard `.status-badge` dimensions. */
  size?: BadgeSize;
  /** Optional leading icon rendered inside `.status-badge__icon`. */
  icon?: ReactNode;
  /** Enable subtle pulse animation for urgent/breach indicators. */
  pulse?: boolean;
  children: ReactNode;
}

/**
 * Shared badge primitive backed by the light/dark contrast-verified status
 * tokens in `src/index.css`. `StatusBadge` is built directly on top of this
 * primitive.
 */
export function Badge({
  tone = "gray",
  size = "md",
  icon,
  pulse = false,
  className,
  children,
  ...spanProps
}: BadgeProps) {
  const badgeClassName = [
    "status-badge",
    `status-badge--${tone}`,
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "",
    pulse ? "status-badge--pulse" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={badgeClassName} {...spanProps}>
      {icon ? <span className="status-badge__icon">{icon}</span> : null}
      {children}
    </span>
  );
}
