import type { HTMLAttributes, ReactNode } from "react";
import type { StatusColorToken, StatusMeta } from "../../lib/statusConfig";

export type StatusBadgeColor = StatusColorToken;

type StatusBadgeSpanProps = Omit<HTMLAttributes<HTMLSpanElement>, "color">;

interface StatusBadgeBaseProps extends StatusBadgeSpanProps {
  tooltip?: string;
  pulse?: boolean;
  icon?: ReactNode;
}

/**
 * A badge can either be driven by a config entry (`meta`) or by explicit
 * `color`/`label` props. The union keeps both variants type-safe: passing a
 * `meta` without a `label` is a compile error, and so is the other way round.
 */
type StatusBadgeProps = StatusBadgeBaseProps &
  (
    | { meta: StatusMeta; color?: never; label?: never }
    | { meta?: never; color: StatusBadgeColor; label: string }
  );

export function StatusBadge({
  color,
  label,
  tooltip,
  pulse = false,
  icon,
  meta,
  className,
  ...spanProps
}: StatusBadgeProps) {
  const Icon = meta?.icon;
  const resolvedColor = meta ? meta.color : (color as StatusBadgeColor);
  const resolvedLabel = meta ? meta.label : (label as string);
  const resolvedTooltip = meta ? meta.description : tooltip;
  const resolvedPulse = meta ? (meta.pulse ?? false) : pulse;
  const resolvedIcon = icon ?? (Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null);

  const badgeClassName = [
    "status-badge",
    `status-badge--${resolvedColor}`,
    resolvedPulse ? "status-badge--pulse" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const badge = (
    <span className={badgeClassName} {...spanProps}>
      {resolvedIcon ? <span className="status-badge__icon">{resolvedIcon}</span> : null}
      <span>{resolvedLabel}</span>
    </span>
  );

  if (!resolvedTooltip) {
    return badge;
  }

  return (
    <div className="group relative inline-flex">
      {badge}
      <div className="status-badge__tooltip-wrapper">
        <div className="status-badge__tooltip">{resolvedTooltip}</div>
      </div>
    </div>
  );
}
