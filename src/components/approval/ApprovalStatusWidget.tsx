import React from 'react';
import { CheckCircle2, Users } from 'lucide-react';
import { StellarTxLink } from '../ui/StellarTxLink';

export interface ApprovalStatusWidgetProps {
  /** Current number of approvals received */
  received: number;
  /** Total number of approvals required for quorum */
  required: number;
  /** Optional Stellar account ID to link to explorer */
  escrowAccountId?: string;
}

/**
 * ApprovalStatusWidget
 * 
 * A UI component that visualizes the progress toward a multi-party approval quorum.
 * Displays a percentage-based progress bar and status information.
 */
export const ApprovalStatusWidget: React.FC<ApprovalStatusWidgetProps> = ({
  received,
  required,
  escrowAccountId,
}) => {
  const isQuorumMet = received >= required;
  const percentage = Math.min(Math.round((received / required) * 100), 100);

  // Smooth progress bar color transition
  const barColorClass = isQuorumMet ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Users className="w-5 h-5" />
          <span className="text-sm uppercase tracking-wider">Quorum Status</span>
        </div>
        <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
          {received} of {required} approvals
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-6">
        <div
          role="progressbar"
          aria-valuenow={received}
          aria-valuemin={0}
          aria-valuemax={required}
          data-testid="progress-bar"
          className={`h-full ${barColorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status Messages & Actions */}
      <div className="space-y-4">
        {isQuorumMet ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              All approvals received — escrow will be created
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">
            Waiting for {required - received} more approval{required - received !== 1 ? 's' : ''}...
          </p>
        )}

        {escrowAccountId && (
          <div className="pt-4 border-t border-slate-100">
            <StellarTxLink
              id={escrowAccountId}
              type="account"
              label="View Escrow on Stellar Expert"
              className="group-hover:-translate-y-0.5 transition-transform"
            />
          </div>
        )}
      </div>
    </div>
  );
};
