import {
  AdoptionCompleteButton,
  EscrowFundedBanner,
  EscrowStatusCard,
  type SettlementSummary,
} from "../components/escrow";

interface SettlementSummaryPageProps {
  summary: SettlementSummary;
  isAdmin?: boolean;
  onComplete?: () => void | Promise<void>;
}

export function SettlementSummaryPage({
  summary,
  isAdmin = false,
  onComplete = () => undefined,
}: SettlementSummaryPageProps) {
  const { escrow } = summary;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            Settlement Summary
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{summary.headline}</h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300">
            {summary.description}
          </p>
        </section>

        {escrow.status === "FUNDED" ? (
          <EscrowFundedBanner
            adoptionId={escrow.adoptionId}
            petName={escrow.petName}
            amount={escrow.amount}
            currency={escrow.currency}
            txHash={escrow.txHash}
          />
        ) : null}

        <EscrowStatusCard escrowId={escrow.escrowId} initialData={escrow} />

        <section className="flex justify-end">
          <AdoptionCompleteButton isAdmin={isAdmin} onConfirm={onComplete} />
        </section>
      </div>
    </main>
  );
}
