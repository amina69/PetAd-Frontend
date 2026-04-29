import React from "react";
import { Check, X, Clock } from "lucide-react";
import type { ApprovalDecision } from "../../types/adoption";

export interface MultiPartyApprovalUIProps {
  required: string[];
  given: ApprovalDecision[];
  pending: string[];
}

/**
 * MultiPartyApprovalUI
 * 
 * Renders each required approver role with their current decision status.
 * Used to track the progress of multi-party approvals in a clear, accessible list.
 */
export const MultiPartyApprovalUI: React.FC<MultiPartyApprovalUIProps> = ({
  required,
  given,
  pending,
}) => {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-50 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Approval Status
        </h3>
      </div>
      <ul className="divide-y divide-gray-50">
        {required.map((role) => {
          const decision = given.find((d) => d.approverRole === role);
          const isPending = pending.includes(role);
          
          return (
            <li 
              key={role} 
              className={`flex items-center justify-between p-4 transition-colors ${isPending ? 'bg-gray-50/30' : 'bg-white'}`}
              aria-label={`Approval status for ${role}`}
            >
              <div className="flex items-center gap-3">
                {/* Initials Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                  isPending 
                    ? 'bg-gray-100 border-gray-200 text-gray-400' 
                    : decision?.status === 'APPROVED'
                      ? 'bg-green-50 border-green-100 text-green-600'
                      : decision?.status === 'REJECTED'
                        ? 'bg-red-50 border-red-100 text-red-600'
                        : 'bg-gray-100 border-gray-200 text-gray-500'
                }`}>
                  {role.charAt(0)}
                </div>
                
                <div>
                  <p className={`text-sm font-bold ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                    {role}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isPending ? 'Awaiting decision' : decision?.approverName || 'Decision recorded'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                {isPending ? (
                  <div className="flex items-center gap-1.5 text-gray-400" title="Pending">
                    <Clock size={16} />
                    <span className="text-xs font-medium uppercase tracking-tight">Pending</span>
                  </div>
                ) : decision?.status === 'APPROVED' ? (
                  <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100" title="Approved">
                    <Check size={14} strokeWidth={3} />
                    <span className="text-xs font-bold uppercase tracking-tight">Approved</span>
                  </div>
                ) : decision?.status === 'REJECTED' ? (
                  <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100" title="Rejected">
                    <X size={14} strokeWidth={3} />
                    <span className="text-xs font-bold uppercase tracking-tight">Rejected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-400" title="Expired">
                    <Clock size={16} />
                    <span className="text-xs font-medium uppercase tracking-tight">Expired</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
