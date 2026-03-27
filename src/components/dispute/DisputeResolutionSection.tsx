import type { FC } from "react";
import { Dispute } from "../../types/dispute";
import { SplitOutcomeChart } from "../escrow/SplitOutcomeChart";
import { StellarTxLink } from "../escrow/StellarTxLink";

interface DisputeResolutionSectionProps {
  dispute: Dispute;
}

export const DisputeResolutionSection: FC<DisputeResolutionSectionProps> = ({
  dispute,
}) => {
  if (dispute.status !== "RESOLVED" || !dispute.resolution) {
    return null;
  }

  const { resolution } = dispute;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Resolution
      </h2>

      <div className="space-y-4">
        {/* Resolution Type Badge */}
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {resolution.type}
          </span>
        </div>

        {/* Admin Note */}
        <div>
          <h3 className="text-sm font-medium text-gray-700">Admin Note</h3>
          <p className="mt-1 text-sm text-gray-900">{resolution.adminNote}</p>
        </div>

        {/* Resolved By */}
        <div>
          <h3 className="text-sm font-medium text-gray-700">Resolved By</h3>
          <p className="mt-1 text-sm text-gray-900">{resolution.resolvedBy}</p>
        </div>

        {/* Resolved At */}
        <div>
          <h3 className="text-sm font-medium text-gray-700">Resolved At</h3>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(resolution.resolvedAt).toLocaleString()}
          </p>
        </div>

        {/* Split Chart if SPLIT */}
        {resolution.type === "SPLIT" && resolution.distribution && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Distribution
            </h3>
            <SplitOutcomeChart distribution={resolution.distribution} />
          </div>
        )}

        {/* Stellar Tx Link */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Resolution Transaction
          </h3>
          <StellarTxLink txHash={resolution.resolutionTxHash} />
        </div>
      </div>
    </div>
  );
};