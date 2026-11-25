import { StatusBadge, type StatusBadgeColor } from "../ui/StatusBadge";
import { StellarTxLink } from "../ui/StellarTxLink";
import { SplitOutcomeChart } from "../escrow/SplitOutcomeChart";
import type { DisputeDetail, ResolutionType } from "../../pages/disputes/types";
import { stellarExplorerUrl } from "../../lib/stellar";
import { useLocale } from "../../i18n";
import { formatDateTime } from "../../lib/date";

interface Props {
  dispute: DisputeDetail;
}

const RESOLUTION_TYPE_META: Record<
  ResolutionType,
  { label: string; color: StatusBadgeColor }
> = {
  REFUND: { label: "Refund", color: "blue" },
  RELEASE: { label: "Release", color: "green" },
  SPLIT: { label: "Split", color: "amber" },
};

export function DisputeResolutionSection({ dispute }: Props) {
  const { locale } = useLocale();
  if (dispute.status !== "RESOLVED" || !dispute.resolution) {
    return null;
  }

  const { resolution } = dispute;
  const meta = RESOLUTION_TYPE_META[resolution.type];

  // Build Stellar explorer URL from txHash if present
  let stellarTxId: string | undefined;
  try {
    if (resolution.resolutionTxHash) {
      stellarExplorerUrl(resolution.resolutionTxHash); // validate
      stellarTxId = resolution.resolutionTxHash;
    }
  } catch {
    stellarTxId = undefined;
  }

  return (
    <section
      data-testid="dispute-resolution-section"
      className="bg-white shadow rounded-lg p-6 mt-6"
      aria-labelledby="resolution-heading"
    >
      <h2
        id="resolution-heading"
        className="text-lg font-semibold text-gray-900 mb-4"
      >
        Resolution
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Resolution type badge */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Resolution Type
            </p>
            <StatusBadge
              color={meta.color}
              label={meta.label}
              data-testid="resolution-type-badge"
            />
          </div>

          {/* Admin note */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Admin Note
            </p>
            <p
              className="text-sm text-gray-800 bg-gray-50 rounded-md p-3 border border-gray-100"
              data-testid="resolution-admin-note"
            >
              {resolution.adminNote}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Resolved by */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Resolved By
            </p>
            <p
              className="text-sm font-medium text-gray-900"
              data-testid="resolution-resolved-by"
            >
              {resolution.resolvedBy}
            </p>
          </div>

          {/* Resolved at */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Resolved At
            </p>
            <p
              className="text-sm text-gray-700"
              data-testid="resolution-resolved-at"
            >
              {formatDateTime(resolution.resolvedAt, locale, undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Stellar tx link */}
          {stellarTxId && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Transaction
              </p>
              <StellarTxLink
                id={stellarTxId}
                type="tx"
                data-testid="resolution-stellar-tx-link"
              />
            </div>
          )}
        </div>
      </div>

      {/* SPLIT: render distribution chart */}
      {resolution.type === "SPLIT" &&
        resolution.splitDistribution &&
        resolution.splitDistribution.length > 0 && (
          <div className="mt-6" data-testid="resolution-split-chart">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Fund Distribution
            </p>
            <SplitOutcomeChart distribution={resolution.splitDistribution} />
          </div>
        )}
    </section>
  );
}
