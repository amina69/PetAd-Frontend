import type { FC } from "react";
import { format } from "date-fns";
import { CheckCircle2, Info, Gavel } from "lucide-react";
import type { DisputeStatus, DisputeResolution } from "../../types/dispute";
import { SplitOutcomeChart } from "../escrow/SplitOutcomeChart";
import { StellarTxLink } from "../ui/StellarTxLink";

interface DisputeResolutionSectionProps {
  status: DisputeStatus;
  resolution?: DisputeResolution;
}

export const DisputeResolutionSection: FC<DisputeResolutionSectionProps> = ({
  status,
  resolution,
}) => {
  if (status !== "resolved" || !resolution) {
    return null;
  }

  const { type, adminNote, resolvedBy, resolvedAt, resolutionTxHash, splitData } = resolution;

  const typeStyles = {
    REFUND: "bg-orange-100 text-orange-700 border-orange-200",
    RELEASE: "bg-green-100 text-green-700 border-green-200",
    SPLIT: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      data-testid="dispute-resolution-section"
    >
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Dispute Resolution</h3>
        </div>
        <span 
          className={`px-3 py-1 rounded-full text-xs font-bold border ${typeStyles[type]}`}
          data-testid="resolution-type-badge"
        >
          {type}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Note Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Info className="w-4 h-4" />
            <span>Resolution Note</span>
          </div>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 italic">
            "{adminNote}"
          </p>
        </div>

        {/* Split Chart if applicable */}
        {type === "SPLIT" && splitData && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Gavel className="w-4 h-4" />
              <span>Fund Distribution</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <SplitOutcomeChart distribution={splitData} />
            </div>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-gray-500">Resolved By</span>
            <p className="font-medium text-gray-900">{resolvedBy}</p>
          </div>
          <div className="space-y-1">
            <span className="text-gray-500">Resolved At</span>
            <p className="font-medium text-gray-900">
              {format(new Date(resolvedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          {resolutionTxHash && (
            <div className="sm:col-span-2 space-y-1">
              <span className="text-gray-500">Stellar Transaction</span>
              <div>
                <StellarTxLink id={resolutionTxHash} type="tx" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
