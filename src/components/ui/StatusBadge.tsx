import type { HTMLAttributes, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  MinusCircle,
  ShieldAlert,
} from "lucide-react";

export type StatusBadgeColor =
  | "gray"
  | "blue"
  | "teal"
  | "green"
  | "amber"
  | "red";

const STATUS_ICONS: Record<StatusBadgeColor, ReactNode> = {
  gray: <MinusCircle aria-hidden="true" className="h-3.5 w-3.5" />,
  blue: <Info aria-hidden="true" className="h-3.5 w-3.5" />,
  teal: <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />,
  green: <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />,
  amber: <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />,
  red: <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />,
};

type StatusBadgeSpanProps = Omit<HTMLAttributes<HTMLSpanElement>, "color">;

interface StatusBadgeProps extends StatusBadgeSpanProps {
  color: StatusBadgeColor;
  label: string;
  tooltip?: string;
  pulse?: boolean;
  icon?: ReactNode;
}

export function StatusBadge({
  color,
  label,
  tooltip,
  pulse = false,
  icon,
  className,
  ...spanProps
}: StatusBadgeProps) {
  const badgeClassName = [
    "status-badge",
    `status-badge--${color}`,
    pulse ? "status-badge--pulse" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const badge = (
    <span className={badgeClassName} {...spanProps}>
      <span className="status-badge__icon" data-testid="status-badge-icon">
        {icon ?? STATUS_ICONS[color]}
      </span>
      <span>{label}</span>
    </span>
  );

  if (!tooltip) {
    return badge;
  }

  return (
    <div className="group relative inline-flex">
      {badge}
      <div className="status-badge__tooltip-wrapper">
        <div className="status-badge__tooltip">{tooltip}</div>
      </div>
    </div>
  );
}
