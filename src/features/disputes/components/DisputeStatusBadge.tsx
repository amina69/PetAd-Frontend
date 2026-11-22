import { STATUS_COLOR_CLASSES } from '../../../lib/statusConfig';
import type { DisputeStatus } from '../types/dispute.types';
import { DISPUTE_STATUS_CONFIG } from '../constants/disputeStatusConfig';

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
  className?: string;
}

export function DisputeStatusBadge({ status, className = '' }: DisputeStatusBadgeProps) {
  const config = DISPUTE_STATUS_CONFIG[status];
  const Icon = config.icon;

  const baseClasses = 'relative inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-help group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
  const tokenClasses = STATUS_COLOR_CLASSES[config.colorVariant];
  const colorClasses = `${tokenClasses.bg} ${tokenClasses.text} ${tokenClasses.border}`;
  const pulseClass = config.hasPulse ? 'animate-pulse' : '';

  return (
    <span
      className={`${baseClasses} ${colorClasses} ${pulseClass} ${className}`}
      tabIndex={0}
      role="status"
      aria-label={`${config.label}: ${config.description}`}
      data-testid={`dispute-badge-${status}`}
    >
      <Icon className="h-3 w-3 mr-1" aria-hidden="true" />
      {config.label}

      {/* Tooltip */}
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none z-10 text-center whitespace-normal"
        role="tooltip"
      >
        {config.description}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}
