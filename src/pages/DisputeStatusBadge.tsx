// components/DisputeStatusBadge.tsx
import type { DisputeStatus } from '../types/dispute.types'

interface DisputeStatusBadgeProps {
  status: DisputeStatus
}

const STATUS_CONFIG: Record<
  DisputeStatus,
  { color: string; label: string; description: string }
> = {
  OPEN: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Open',
    description: 'Dispute has been opened and is awaiting review',
  },
  UNDER_REVIEW: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Under Review',
    description: 'Dispute is currently being reviewed by the team',
  },
  RESOLVED: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Resolved',
    description: 'Dispute has been successfully resolved',
  },
  CLOSED: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'Closed',
    description: 'Dispute has been closed',
  },
  SLA_BREACHED: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'SLA Breached',
    description:
      'Dispute has exceeded the service level agreement time limit',
  },
}

export function DisputeStatusBadge({ status }: DisputeStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="relative inline-block group">
      {/* Badge */}
      <span
        className={`
          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
          ${config.color}
          ${status === 'SLA_BREACHED' ? 'animate-pulse-subtle' : ''}
        `}
      >
        {config.label}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap relative">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      </div>

      {/* Subtle pulse animation */}
      <style>
        {`
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse-subtle {
            animation: pulse-subtle 2s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  )
}

export default DisputeStatusBadge