import type { AdoptionStatus } from "../../types/adoption";

interface EscrowProgressStepperProps {
  currentStatus: AdoptionStatus;
}

interface StepDefinition {
  key: string;
  label: string;
  status: AdoptionStatus;
}

const BASE_STEPS: StepDefinition[] = [
  {
    key: "ESCROW_CREATED",
    label: "Escrow Created",
    status: "ESCROW_CREATED",
  },
  {
    key: "ESCROW_FUNDED",
    label: "Escrow Funded",
    status: "ESCROW_FUNDED",
  },
  {
    key: "SETTLEMENT_TRIGGERED",
    label: "Settlement Triggered",
    status: "SETTLEMENT_TRIGGERED",
  },
  {
    key: "FUNDS_RELEASED",
    label: "Funds Released",
    status: "FUNDS_RELEASED",
  },
];

const DISPUTE_STEPS: StepDefinition[] = [
  BASE_STEPS[0],
  BASE_STEPS[1],
  {
    key: "DISPUTED",
    label: "Dispute in Progress",
    status: "DISPUTED",
  },
  BASE_STEPS[3],
];

const STATUS_ORDER: AdoptionStatus[] = [
  "ESCROW_CREATED",
  "ESCROW_FUNDED",
  "SETTLEMENT_TRIGGERED",
  "DISPUTED",
  "FUNDS_RELEASED",
];

function getSteps(currentStatus: AdoptionStatus) {
  return currentStatus === "DISPUTED" ? DISPUTE_STEPS : BASE_STEPS;
}

function getStepState(stepStatus: AdoptionStatus, currentStatus: AdoptionStatus) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const stepIndex = STATUS_ORDER.indexOf(stepStatus);

  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (stepStatus === currentStatus) {
    return "current";
  }

  return "upcoming";
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5 8.25 6.5 11 12.5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EscrowProgressStepper({
  currentStatus,
}: EscrowProgressStepperProps) {
  const steps = getSteps(currentStatus);

  return (
    <ol
      role="list"
      aria-label="Escrow settlement progress"
      className="flex flex-col gap-4 rounded-3xl border border-[#E7EAF0] bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3"
    >
      {steps.map((step, index) => {
        const state = getStepState(step.status, currentStatus);
        const isCurrent = state === "current";
        const isComplete = state === "complete";
        const isUpcoming = state === "upcoming";

        return (
          <li
            key={step.key}
            aria-current={isCurrent ? "step" : undefined}
            className="flex min-w-0 flex-1 items-start gap-3"
          >
            <div className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              <div className="flex items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                    isComplete
                      ? "border-[#E84D2A] bg-[#E84D2A] text-white"
                      : isCurrent
                        ? "border-[#E84D2A] bg-[#FFF1EC] text-[#B93817]"
                        : "border-[#D7DEE8] bg-[#F7F9FC] text-[#90A0B7]"
                  }`}
                >
                  {isComplete ? <CheckIcon /> : index + 1}
                </div>

                {index < steps.length - 1 ? (
                  <div
                    aria-hidden="true"
                    className={`ml-3 hidden h-0.5 w-full min-w-8 rounded-full sm:block ${
                      isComplete ? "bg-[#E84D2A]" : "bg-[#D7DEE8]"
                    }`}
                  />
                ) : null}
              </div>

              <div className="flex-1 pt-1 sm:pt-0">
                <p
                  className={`text-sm font-semibold ${
                    isComplete
                      ? "text-[#0F2236]"
                      : isCurrent
                        ? "text-[#B93817]"
                        : "text-[#8A97A8]"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    isUpcoming ? "text-[#A5B1C2]" : "text-[#66758A]"
                  }`}
                >
                  {isComplete
                    ? "Completed"
                    : isCurrent
                      ? "Current step"
                      : "Upcoming"}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
