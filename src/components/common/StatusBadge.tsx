import { presentationFor, type StatusDomain } from "./statusConfig";

export interface StatusBadgeProps {
  domain: StatusDomain;
  status: string;
}

/**
 * Shared status pill. Callers pass a domain and status; the label and tone
 * come from `statusConfig`.
 *
 * @example
 * <StatusBadge domain="adoption" status="active" />
 */
export function StatusBadge({ domain, status }: StatusBadgeProps) {
  const presentation = presentationFor(domain, status);
  return (
    <span
      className={`status-badge status-badge--${presentation.tone}`}
      data-domain={domain}
      data-status={status}
      data-tone={presentation.tone}
    >
      {presentation.label}
    </span>
  );
}
