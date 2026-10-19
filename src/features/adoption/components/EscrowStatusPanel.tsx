import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { escrowService } from "../../../api/escrowService";
import { StatusBadge, type StatusBadgeColor } from "../../../components/ui/StatusBadge";

// ─── Presentation ────────────────────────────────────────────────────────────

/** How a single escrow state is presented to the user. */
export interface EscrowStatePresentation {
  /** Short label rendered inside the badge. */
  label: string;
  /** One plain-language sentence explaining what the state means. */
  description: string;
  /** Badge colour taken from the shared status badge palette. */
  color: StatusBadgeColor;
}

/**
 * Copy for every escrow state, written for adopters and caretakers rather
 * than for engineers.
 *
 * The keys cover the vocabulary the escrow API reports (`CREATED`, `FUNDED`,
 * `RELEASED`, `REFUNDED`, `DISPUTED`) together with the equivalent states used
 * by the surrounding screens (`HELD`, `LOCKED`, `AWAITING_FUNDS`, `IN_REVIEW`,
 * `SETTLED`, `SETTLEMENT_FAILED`), so the panel reads the same wherever it is
 * dropped in.
 */
export const ESCROW_STATE_PRESENTATION: Record<string, EscrowStatePresentation> = {
  CREATED: {
    label: "Awaiting payment",
    description:
      "The adoption payment hasn't come through yet. Nothing is held until the payment is confirmed.",
    color: "amber",
  },
  AWAITING_FUNDS: {
    label: "Awaiting payment",
    description:
      "The adoption payment hasn't come through yet. Nothing is held until the payment is confirmed.",
    color: "amber",
  },
  HELD: {
    label: "Payment held",
    description:
      "The adoption payment is being held safely. It's only paid out once the adoption is confirmed.",
    color: "blue",
  },
  FUNDED: {
    label: "Payment held",
    description:
      "The adoption payment is being held safely. It's only paid out once the adoption is confirmed.",
    color: "blue",
  },
  LOCKED: {
    label: "Payment held",
    description:
      "The adoption payment is being held safely. It's only paid out once the adoption is confirmed.",
    color: "blue",
  },
  IN_REVIEW: {
    label: "Under review",
    description:
      "The adoption payment is being checked by the PetAd team. We'll update you as soon as it's done.",
    color: "teal",
  },
  RELEASED: {
    label: "Payment released",
    description: "The adoption payment has been released to the shelter.",
    color: "green",
  },
  SETTLED: {
    label: "Payment released",
    description: "The adoption payment has been released to the shelter.",
    color: "green",
  },
  REFUNDED: {
    label: "Payment refunded",
    description: "The adoption payment has been returned to the adopter.",
    color: "gray",
  },
  DISPUTED: {
    label: "Disputed",
    description:
      "The adoption payment is on hold while the dispute is reviewed. Nothing is paid out until the dispute is resolved.",
    color: "red",
  },
  SETTLEMENT_FAILED: {
    label: "Payment problem",
    description:
      "We couldn't complete this payment. Our team has been notified and will be in touch.",
    color: "red",
  },
};

/**
 * Shown for any state the client doesn't recognise, so an unexpected value
 * from the API never leaks into the interface.
 */
export const UNKNOWN_ESCROW_STATE_PRESENTATION: EscrowStatePresentation = {
  label: "Status unavailable",
  description:
    "We don't have a recognised status for this payment right now. Please check back shortly or contact support.",
  color: "gray",
};

/**
 * Normalise a state so `disputed`, `Disputed` and `DISPUTED` all resolve to the
 * same presentation.
 */
function normalizeState(state: string): string {
  return state.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

/**
 * Resolve the presentation for an escrow state.
 *
 * Unknown (or missing) states fall back to a safe generic label instead of
 * echoing the raw value back to the user.
 */
export function getEscrowStatePresentation(
  state?: string | null,
): EscrowStatePresentation {
  if (typeof state !== "string" || state.trim().length === 0) {
    return UNKNOWN_ESCROW_STATE_PRESENTATION;
  }

  return (
    ESCROW_STATE_PRESENTATION[normalizeState(state)] ??
    UNKNOWN_ESCROW_STATE_PRESENTATION
  );
}

/** Whether the given state means "the payment is being disputed". */
export function isDisputedEscrowState(state?: string | null): boolean {
  if (typeof state !== "string" || state.trim().length === 0) {
    return false;
  }

  return normalizeState(state) === "DISPUTED";
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface EscrowStatusPanelProps {
  /** Id of the escrow record the state is read from. */
  escrowId?: string | null;
  /**
   * A state the caller already knows.
   *
   * When provided, no request is made and the panel renders this state — handy
   * for screens that already carry the state in their own payload.
   */
  status?: string | null;
  /** Id of the dispute thread, used for the "Disputed" link. */
  disputeId?: string | null;
  /** Heading shown above the badge. */
  title?: string;
  /** Extra classes for the wrapper element. */
  className?: string;
}

/**
 * `EscrowStatusPanel` — shows the state of an adoption payment in plain
 * language.
 *
 * The panel reads the escrow record from `GET /escrow/:id` and turns its state
 * into a short badge plus a sentence someone can act on.
 *
 * Guarantees:
 * - Only the lifecycle state (and an optional dispute reference) is ever read
 *   from the response. Keys, secrets, balances and transaction identifiers are
 *   never rendered, derived or forwarded.
 * - An unrecognised state falls back to a generic label instead of showing the
 *   raw value.
 * - A disputed payment links to the dispute thread so the conversation can be
 *   followed.
 *
 * The panel is deliberately self-contained so it can be dropped into any
 * screen that has an adoption or custody payment to describe — including the
 * custody detail view (issue 37).
 */
export function EscrowStatusPanel({
  escrowId,
  status,
  disputeId,
  title = "Payment status",
  className,
}: EscrowStatusPanelProps) {
  const hasKnownStatus = typeof status === "string" && status.trim().length > 0;

  const query = useQuery({
    queryKey: ["escrow-record", escrowId ?? null],
    queryFn: () => {
      if (!escrowId) {
        // Defensive only: `enabled` keeps this query idle without an id.
        throw new Error(
          "EscrowStatusPanel needs an escrow id to load the payment status.",
        );
      }
      return escrowService.getById(escrowId);
    },
    enabled: !hasKnownStatus && Boolean(escrowId),
    staleTime: 30_000,
  });

  const resolvedStatus = hasKnownStatus ? status : query.data?.status;
  const resolvedDisputeId = disputeId ?? query.data?.disputeId ?? null;
  const isDisputed = isDisputedEscrowState(resolvedStatus);

  const panelClassName = [
    "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Nothing to describe yet — no record was supplied.
  if (!hasKnownStatus && !escrowId) {
    return (
      <section className={panelClassName} data-testid="escrow-status-panel-empty">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          No payment is attached to this yet.
        </p>
      </section>
    );
  }

  if (!hasKnownStatus && query.isLoading) {
    return (
      <section
        className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
        data-testid="escrow-status-panel-loading"
      >
        <div className="h-4 w-40 rounded-full bg-slate-200" />
        <div className="mt-4 h-4 w-full rounded-full bg-slate-200" />
        <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-200" />
      </section>
    );
  }

  if (!hasKnownStatus && query.isError) {
    return (
      <section
        className="rounded-3xl border border-amber-200 bg-amber-50 p-6"
        data-testid="escrow-status-panel-error"
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          {title}
        </h2>
        <p className="mt-2 text-sm font-medium text-amber-900">
          We couldn't load the payment status right now. Please try again shortly.
        </p>
      </section>
    );
  }

  const presentation = getEscrowStatePresentation(resolvedStatus);
  const disputeHref = resolvedDisputeId ? `/disputes/${resolvedDisputeId}` : "/disputes";

  return (
    <section className={panelClassName} data-testid="escrow-status-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {title}
          </h2>
          <p
            className="mt-2 text-sm text-slate-600"
            data-testid="escrow-status-description"
          >
            {presentation.description}
          </p>
        </div>
        <StatusBadge
          color={presentation.color}
          label={presentation.label}
          data-testid="escrow-status-badge"
        />
      </div>

      {isDisputed ? (
        <p className="mt-4 text-sm text-slate-700">
          Follow the conversation{" "}
          <Link
            to={disputeHref}
            data-testid="escrow-dispute-link"
            className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
          >
            {resolvedDisputeId ? "View the dispute" : "See all disputes"}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
