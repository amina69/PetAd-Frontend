
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { StellarTxLink } from "./StellarTxLink";

export interface DisputeBannerProps {
  disputeId: string;
  raisedAt: string;
  escrowAccountId: string;
}

function formatRaisedAt(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DisputeBanner({
  disputeId,
  raisedAt,
  escrowAccountId,
}: DisputeBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="dispute-banner"
      className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-950"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-red-500"
          size={18}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">
            Dispute in Progress
          </p>
          <p className="mt-2 text-lg font-semibold">
            A dispute has been raised. Escrow settlement is paused.
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                Dispute ID
              </dt>
              <dd
                className="mt-1 text-sm font-medium text-red-900"
                data-testid="dispute-id"
              >
                {disputeId}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                Raised
              </dt>
              <dd
                className="mt-1 text-sm font-medium text-red-900"
                data-testid="dispute-raised-at"
              >
                {formatRaisedAt(raisedAt)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                Escrow Account
              </dt>
              <dd className="mt-1">
                <StellarTxLink txHash={escrowAccountId} />
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-red-800">
            Review the dispute and submitted evidence.{" "}
            <Link
              to={`/disputes/${disputeId}`}
              data-testid="dispute-detail-link"
              className="font-semibold underline underline-offset-2 hover:text-red-950"
            >
              View dispute details
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
