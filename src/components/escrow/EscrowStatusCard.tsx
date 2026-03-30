import { EscrowProgressStepper } from "./EscrowProgressStepper";
import { EscrowStatusBadge } from "./EscrowStatusBadge";
import { StellarTxLink } from "./StellarTxLink";
import { usePolling } from "../../lib/hooks/usePolling";
import { formatAmount, type EscrowStatusData } from "./types";
import { DisputeBanner } from "./DisputeBanner";

interface EscrowStatusCardProps {
  escrowId: string;
  initialData?: EscrowStatusData;
  fetchStatus?: () => Promise<EscrowStatusData>;
  pollingIntervalMs?: number;
}

export function EscrowStatusCard({
  escrowId,
  initialData,
  fetchStatus,
  pollingIntervalMs = 1000,
}: EscrowStatusCardProps) {
  const query = usePolling(
    ["escrow-status", escrowId],
    fetchStatus || (async () => ({}) as EscrowStatusData),
    {
      intervalMs: pollingIntervalMs,
      stopWhen: (data) => data?.status === "SETTLED",
      enabled: !!fetchStatus,
    },
  );

  const isLoading = query.isLoading && !query.data && !initialData;
  const data = query.data ?? initialData ?? null;

  if (isLoading || !data) {
    return (
      <div
        className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
        data-testid="escrow-status-card-skeleton"
      >
        <div className="h-5 w-40 rounded-full bg-slate-200" />
        <div className="mt-4 h-4 w-full rounded-full bg-slate-200" />
        <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-200" />
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Escrow Status
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {data.petName}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {formatAmount(data.amount, data.currency)} for adoption #
            {data.adoptionId}
          </p>
        </div>
        <EscrowStatusBadge status={data.status} />
      </div>

      <div className="mt-6">
        {data.status === "DISPUTED" && data.disputeId ? (
          <DisputeBanner
            disputeId={data.disputeId}
            raisedAt={
              data.disputeRaisedAt ?? data.fundedAt ?? new Date().toISOString()
            }
            escrowAccountId={data.escrowId}
          />
        ) : (
          <EscrowProgressStepper status={data.status} />
        )}
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Escrow ID
          </dt>
          <dd className="mt-2 text-sm font-medium text-slate-900">
            {data.escrowId}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Latest update
          </dt>
          <dd className="mt-2 text-sm font-medium text-slate-900">
            {data.settledAt || data.fundedAt || "Pending"}
          </dd>
        </div>
      </dl>

      {data.txHash ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Transaction
          </p>
          <div className="mt-2">
            <StellarTxLink txHash={data.txHash} />
          </div>
        </div>
      ) : null}

      {data.status === "SETTLED" ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          Settlement complete. Polling stops after this terminal state is
          reached.
        </p>
      ) : null}

      {data.status === "SETTLEMENT_FAILED" && data.failureReason ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
          {data.failureReason}
        </p>
      ) : null}
    </section>
  );
}
