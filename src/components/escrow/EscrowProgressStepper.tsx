import type { EscrowStatus } from "./types";

const STEPS = [
  { id: "funding", label: "Funding" },
  { id: "review", label: "Review" },
  { id: "settlement", label: "Settlement" },
] as const;

function getStepState(status: EscrowStatus, index: number) {
  if (status === "AWAITING_FUNDS") {
    return index === 0 ? "current" : "upcoming";
  }

  if (status === "FUNDED") {
    return index === 0 ? "complete" : index === 1 ? "current" : "upcoming";
  }

  if (status === "IN_REVIEW" || status === "DISPUTED") {
    return index < 2 ? "complete" : "current";
  }

  return "complete";
}

interface EscrowProgressStepperProps {
  status: EscrowStatus;
}

export function EscrowProgressStepper({
  status,
}: EscrowProgressStepperProps) {
  return (
    <div className="space-y-3" data-testid="escrow-progress-stepper">
      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const state = getStepState(status, index);
          const stateClass =
            state === "complete"
              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
              : state === "current"
                ? "border-sky-500 bg-sky-50 text-sky-900"
                : "border-slate-200 bg-white text-slate-500";

          return (
            <li
              className={`rounded-2xl border p-4 ${stateClass}`}
              data-state={state}
              key={step.id}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Step {index + 1}
              </p>
              <p className="mt-2 text-base font-semibold">{step.label}</p>
            </li>
          );
        })}
      </ol>

      {status === "DISPUTED" ? (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
          data-testid="escrow-disputed-branch"
        >
          The settlement is paused while the dispute is under review.
        </div>
      ) : null}
    </div>
  );
}
