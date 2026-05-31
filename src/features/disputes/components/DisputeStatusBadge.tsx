import type { DisputeStatus } from '../types/dispute.types';
import { DISPUTE_STATUS_CONFIG } from '../constants/disputeStatusConfig';

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
  className?: string;
}

const COLOR_STYLES: Record<string, string> = {
  red: 'bg-red-100 text-red-800 border-red-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function DisputeStatusBadge({ status, className = '' }: DisputeStatusBadgeProps) {
  const config = DISPUTE_STATUS_CONFIG[status];
  
  const baseClasses = 'relative inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-help group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
  const colorClasses = COLOR_STYLES[config.colorVariant];
  const pulseClass = config.hasPulse ? 'animate-pulse' : '';
  
  return (
    <span
      className={`${baseClasses} ${colorClasses} ${pulseClass} ${className}`}
      tabIndex={0}
      role="status"
      aria-label={`${config.label}: ${config.description}`}
      data-testid={`dispute-badge-${status}`}
    >
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


  // Issues Implemented