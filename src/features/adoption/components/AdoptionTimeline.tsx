import { Check, Circle, X } from "lucide-react";
import {
  ADOPTION_TIMELINE_STEPS,
  getStepIndexForStatus,
  type AdoptionStepDefinition,
} from "../constants/statusConfig";
import type { AdoptionRequestStatus } from "../schemas/adoptionStatusSchema";

export interface AdoptionTimelineProps {
  /** Current status of the adoption being tracked. */
  status: AdoptionRequestStatus;
  /** Decision reason supplied when a request was rejected/cancelled. */
  decisionReason?: string | null;
  /** Accessible label for the timeline, defaults to "Adoption progress". */
  ariaLabel?: string;
}

type StepState = "complete" | "current" | "upcoming" | "rejected";

function getStepState(
  stepIndex: number,
  currentIndex: number,
  status: AdoptionRequestStatus,
): StepState {
  // A rejected request never advances past the step it was rejected at.
  if (status === "REJECTED") {
    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "rejected";
    return "upcoming";
  }
  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) {
    // The terminal COMPLETED status marks the final step as complete too.
    return status === "COMPLETED" ? "complete" : "current";
  }
  return "upcoming";
}

const STEP_STYLES: Record<StepState, { circle: string; connector: string; label: string; description: string }> = {
  complete: {
    circle: "bg-green-100 text-green-600 ring-green-600",
    connector: "bg-green-600",
    label: "text-gray-900",
    description: "text-gray-500",
  },
  current: {
    circle: "bg-orange-100 text-orange-600 ring-orange-600",
    connector: "bg-gray-200",
    label: "text-gray-900",
    description: "text-gray-500",
  },
  rejected: {
    circle: "bg-red-100 text-red-600 ring-red-600",
    connector: "bg-gray-200",
    label: "text-red-700",
    description: "text-red-600",
  },
  upcoming: {
    circle: "bg-gray-100 text-gray-400 ring-gray-300",
    connector: "bg-gray-200",
    label: "text-gray-400",
    description: "text-gray-400",
  },
};

function StepIcon({ state }: { state: StepState }) {
  if (state === "complete") return <Check className="h-4 w-4" aria-hidden="true" />;
  if (state === "rejected") return <X className="h-4 w-4" aria-hidden="true" />;
  return <Circle className="h-2 w-2 fill-current" aria-hidden="true" />;
}

/**
 * AdoptionTimeline
 *
 * Renders the adopter-facing progress of an adoption request through the
 * four steps defined in `ADOPTION_TIMELINE_STEPS` (issue 39 statusConfig):
 * inquiry → review → approved → completed.
 *
 * When the request was rejected and the backend supplied a decision reason,
 * the reason is rendered beneath the timeline so adopters know why.
 */
export function AdoptionTimeline({
  status,
  decisionReason,
  ariaLabel = "Adoption progress",
}: AdoptionTimelineProps) {
  const currentIndex = getStepIndexForStatus(status);
  const showReason = status === "REJECTED" && !!decisionReason;

  return (
    <nav aria-label={ariaLabel}>
      <ol className="relative space-y-6">
        {ADOPTION_TIMELINE_STEPS.map((step: AdoptionStepDefinition, index) => {
          const state = getStepState(index, currentIndex, status);
          const styles = STEP_STYLES[state];
          const isLast = index === ADOPTION_TIMELINE_STEPS.length - 1;

          return (
            <li
              key={step.id}
              className="relative flex gap-4"
              data-testid={`timeline-step-${step.id}`}
              data-state={state}
            >
              {/* Connecting line */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={`absolute left-4 top-8 h-[calc(100%-1rem)] w-px ${styles.connector}`}
                />
              )}

              {/* Step marker */}
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${styles.circle}`}
              >
                <StepIcon state={state} />
              </div>

              {/* Step copy */}
              <div className="pt-1">
                <p className={`text-sm font-semibold ${styles.label}`}>{step.label}</p>
                <p className={`text-sm ${styles.description}`}>{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Rejection decision reason (acceptance criterion) */}
      {showReason && (
        <div
          role="note"
          data-testid="decision-reason"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm font-semibold text-red-800">Reason for rejection</p>
          <p className="mt-1 text-sm text-red-700">{decisionReason}</p>
        </div>
      )}
    </nav>
  );
}
