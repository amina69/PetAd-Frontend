import { ArrowRight } from 'lucide-react';
import { AdoptionStatusBadge } from './AdoptionStatusBadge';
import { StellarTxLink } from './StellarTxLink';
import type { AdoptionTimelineEntry } from '../../types/adoption';

interface TimelineEntryProps {
  entry: AdoptionTimelineEntry;
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function getAbsoluteTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

function getAriaLabel(entry: AdoptionTimelineEntry): string {
  const parts = [];
  
  if (entry.fromStatus && entry.toStatus) {
    parts.push(`Status changed from ${entry.fromStatus.replace(/_/g, ' ')} to ${entry.toStatus.replace(/_/g, ' ')}`);
  }
  
  if (entry.actor) {
    parts.push(`by ${entry.actor}`);
    if (entry.actorRole) {
      parts.push(`(${entry.actorRole})`);
    }
  }
  
  if (entry.reason) {
    parts.push(`Reason: ${entry.reason}`);
  }
  
  if (entry.isAdminOverride) {
    parts.push('Admin override');
  }
  
  parts.push(`at ${getAbsoluteTime(entry.timestamp)}`);
  
  return parts.join(' ');
}

export function TimelineEntry({ entry }: TimelineEntryProps) {
  const relativeTime = getRelativeTime(entry.timestamp);
  const absoluteTime = getAbsoluteTime(entry.timestamp);
  const ariaLabel = getAriaLabel(entry);

  return (
    <li 
      className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
      aria-label={ariaLabel}
    >
      {/* Status transition */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {entry.fromStatus && (
          <>
            <AdoptionStatusBadge status={entry.fromStatus} />
            <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </>
        )}
        {entry.toStatus && <AdoptionStatusBadge status={entry.toStatus} />}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Actor and role */}
        {(entry.actor || entry.actorRole) && (
          <div className="flex items-center gap-2 mb-1">
            {entry.actor && (
              <span className="font-medium text-gray-900">{entry.actor}</span>
            )}
            {entry.actorRole && (
              <span className="text-sm text-gray-500">({entry.actorRole})</span>
            )}
          </div>
        )}

        {/* Message */}
        {entry.message && (
          <p className="text-sm text-gray-600 mb-2">{entry.message}</p>
        )}

        {/* Reason */}
        {entry.reason && (
          <p className="text-sm text-gray-600 mb-2">{entry.reason}</p>
        )}

        {/* Transaction link */}
        {entry.sdkTxHash && (
          <div className="mb-2">
            <StellarTxLink id={entry.sdkTxHash} type="tx" />
          </div>
        )}

        {/* Admin override label */}
        {entry.isAdminOverride && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
              Admin override
            </span>
          </div>
        )}

        {/* Escrow Paused badge */}
        {entry.escrowPaused && (
          <div className="mb-2 flex items-center gap-1.5" data-testid="escrow-paused-badge">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Escrow Paused
            </span>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-right">
        <time 
          dateTime={entry.timestamp}
          title={absoluteTime}
          className="text-sm text-gray-500 hover:text-gray-700 cursor-help"
        >
          {relativeTime}
        </time>
      </div>
    </li>
  );
}
