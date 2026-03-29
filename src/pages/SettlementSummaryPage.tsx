import { useParams } from "react-router-dom";
import { useSettlementSummary } from "../hooks/useSettlementSummary";
import { useRetrySettlement } from "../hooks/useRetrySettlement";
import { EscrowStatusBadge } from "../components/escrow/EscrowStatusBadge";
import { StellarTxLink } from "../components/escrow/StellarTxLink";
import { EscrowFundedBanner } from "../components/escrow/EscrowFundedBanner";
import { AdoptionCompleteButton } from "../components/escrow/AdoptionCompleteButton";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";
import type { EscrowStatus } from "../components/escrow/types";
import type { EscrowOnChainStatus } from "../types/escrow";
import type { SettlementSummary as UISettlementSummary } from "../components/escrow/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map the API-level on-chain status to the EscrowStatus union that
 * EscrowStatusBadge understands.
 */
const ON_CHAIN_TO_ESCROW_STATUS: Record<EscrowOnChainStatus, EscrowStatus> = {
  PENDING: "IN_REVIEW",
  SUCCESS: "SETTLED",
  FAILED: "SETTLEMENT_FAILED",
};

/**
 * Extract the raw transaction hash from a Stellar explorer URL.
 * Expected format: https://stellar.expert/explorer/testnet/tx/{txHash}
 */
function extractTxHash(explorerUrl: string): string | undefined {
  const match = explorerUrl.split("/tx/");
  return match[1] ?? undefined;
}

/**
 * Format a payment's share of the total as a percentage string.
 * Returns "—" when total is zero to avoid division-by-zero display issues.
 */
function formatPercentage(amount: number, total: number): string {
  if (total === 0) return "—";
  return `${((amount / total) * 100).toFixed(1)}%`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Skeleton placeholder for a single payment row while data is loading. */
function PaymentRowSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 px-4 py-3 items-center">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="50%" className="ml-auto" />
      <Skeleton variant="text" width="40%" className="ml-auto" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface SettlementSummaryPageProps {
  /**
   * When true, shows the admin-only "Retry Settlement" button on failure.
   */
  isAdmin?: boolean;
  /**
   * Optional prop-driven summary for testing or hybrid usage.
   */
  summary?: UISettlementSummary;
  /**
   * Optional callback when the admin completes the adoption.
   */
  onComplete?: () => void;
}

export function SettlementSummaryPage({
  isAdmin = false,
  summary: propSummary,
  onComplete,
}: SettlementSummaryPageProps) {
  const { adoptionId: paramAdoptionId } = useParams<{ adoptionId: string }>();

  // If we have a prop-driven summary, we follow its status/data.
  // Otherwise, we fetch on-chain settlement details for the adoption.
  const adoptionId = propSummary?.escrow.adoptionId || paramAdoptionId;
  const { data, isLoading: hookLoading, isError: hookError } = useSettlementSummary(
    propSummary ? "" : (adoptionId ?? ""),
  );

  const isLoading = propSummary ? false : hookLoading;
  const isError = propSummary ? false : hookError;

  const isFailed = data?.onChainStatus === "FAILED" || propSummary?.status === "SETTLEMENT_FAILED";
  const txHash = data?.stellarExplorerUrl
    ? extractTxHash(data.stellarExplorerUrl)
    : propSummary?.escrow.txHash;

  const totalAmount = data?.payments.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const escrowStatus: EscrowStatus | undefined = propSummary?.status 
    ? propSummary.status 
    : data?.onChainStatus
    ? ON_CHAIN_TO_ESCROW_STATUS[data.onChainStatus]
    : undefined;

  const headline = propSummary?.headline || "Settlement Summary";
  const description = propSummary?.description || (adoptionId ? `Adoption #${adoptionId}` : "");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{headline}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>

        {/* ── Actions / Banners ── */}
        {escrowStatus === "FUNDED" && propSummary && (
          <EscrowFundedBanner
<EscrowFundedBanner
  adoptionId={escrow.adoptionId}
  petName={escrow.petName}
  amount={propSummary.escrow.amount}
  currency={propSummary.escrow.currency}
  txHash={escrow.txHash}
  escrowId={propSummary.escrow.escrowId}
/>
          />
        )}

        {/* ── Status + confirmation depth ── */}
        <div className="flex flex-wrap items-center gap-3">
          {isLoading ? (
            <Skeleton width={120} height={32} />
          ) : escrowStatus ? (
            <EscrowStatusBadge status={escrowStatus} />
          ) : null}

          {!isLoading && data && (
            <span className="text-sm text-gray-600">
              Confirmed ({data.confirmations} ledger confirmation
              {data.confirmations !== 1 ? "s" : ""})
            </span>
          )}
        </div>

        {/* ── SETTLEMENT_FAILED banner ── */}
        {isFailed && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3"
          >
            <div>
              <h2 className="text-base font-semibold text-red-800">
                Settlement Failed
              </h2>
              <p className="text-sm text-red-700 mt-1">
                {propSummary?.escrow.failureReason || 
                 "The payout could not be completed. Please review the transaction and retry."}
              </p>
            </div>

            {isAdmin && adoptionId && (
              <RetryButton adoptionId={adoptionId} />
            )}
          </div>
        )}

        {/* ── Transaction link ── */}
        {!isLoading && txHash && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Settlement Transaction
            </p>
            <StellarTxLink txHash={txHash} />
          </div>
        )}

        {isLoading && (
          <div>
            <Skeleton variant="text" width="40%" className="mb-2" />
            <Skeleton variant="text" width="60%" />
          </div>
        )}

        {/* ── Payment recipients table ── */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Payment Recipients
            </h2>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <PaymentRowSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && (!data || data.payments.length === 0) && (
            <div className="p-8">
              <EmptyState
                title="No settlement data yet"
                description="Payment details will appear here once the escrow settlement is processed."
              />
            </div>
          )}

          {/* Data rows */}
          {!isLoading && data && data.payments.length > 0 && (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-3 px-4 py-2 bg-gray-50
                              text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span>Recipient</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Share</span>
              </div>

              <div className="divide-y divide-gray-100">
                {data.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid grid-cols-3 px-4 py-3 items-center"
                  >
                    {/* Destination address as recipient name */}
                    <span
                      className="text-sm text-gray-900 truncate"
                      title={payment.destination}
                    >
                      {payment.destination}
                    </span>

                    {/* Amount in XLM/asset */}
                    <span className="text-sm font-semibold text-gray-900 text-right">
                      {payment.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 7,
                      })}{" "}
                      {payment.asset}
                    </span>

                    {/* Percentage of total */}
                    <span className="text-sm text-gray-500 text-right">
                      {formatPercentage(payment.amount, totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Fetch error ── */}
        {isError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm text-red-700">
              Failed to load settlement summary. Please refresh and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Internal helper for the retry logic to keep the main component cleaner. */
function RetryButton({ adoptionId }: { adoptionId: string }) {
  const retryMutation = useRetrySettlement(adoptionId);
  return (
    <button
      type="button"
      onClick={() => retryMutation.mutateRetrySettlement()}
      disabled={retryMutation.isPending}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white
                 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500
                 focus-visible:ring-offset-2"
    >
      {retryMutation.isPending ? "Retrying…" : "Retry Settlement"}
    </button>
  );
}