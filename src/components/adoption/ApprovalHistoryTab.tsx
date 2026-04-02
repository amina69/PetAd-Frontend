import { Check, X, Clock } from "lucide-react";
import { adoptionService } from "../../api/adoptionService";
import { useApiQuery } from "../../hooks/useApiQuery";
import { StellarTxLink } from "../ui/StellarTxLink";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/emptyState";
import type { ApprovalDecision } from "../../types/adoption";

interface ApprovalHistoryTabProps {
  adoptionId: string;
}

export default function ApprovalHistoryTab({ adoptionId }: ApprovalHistoryTabProps) {
  const { data: approvals, isLoading, isError } = useApiQuery<ApprovalDecision[]>(
    ["approvals", adoptionId],
    () => adoptionService.getApprovals(adoptionId)
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <Skeleton className="w-24 h-6 rounded-full" />
            </div>
            <Skeleton className="w-full h-4 mb-2" />
            <Skeleton className="w-2/3 h-4" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <EmptyState
          title="Error loading history"
          description="Failed to fetch approval history. Please try again later."
        />
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          title="No approval history yet"
          description="Decisions will appear here once the approval process begins."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {approvals.map((decision) => (
        <div 
          key={decision.id} 
          className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center font-bold text-gray-400">
                {decision.approverName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0D162B]">{decision.approverName}</p>
                <p className="text-xs text-gray-500">{decision.approverRole}</p>
              </div>
            </div>
            <StatusBadge status={decision.status} />
          </div>

          {decision.reason && (
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4 italic">
              "{decision.reason}"
            </p>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{new Date(decision.timestamp).toLocaleString()}</span>
            </div>
            {decision.txHash && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500">Tx:</span>
                <StellarTxLink id={decision.txHash} type="tx" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ApprovalDecision["status"] }) {
  switch (status) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full">
          <Check size={12} strokeWidth={3} />
          Approved
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full">
          <X size={12} strokeWidth={3} />
          Rejected
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-full">
          <Clock size={12} strokeWidth={3} />
          Expired
        </span>
      );
    default:
      return null;
  }
}
