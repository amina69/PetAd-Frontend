import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { ApprovalDecision } from "../../types/adoption";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovalStatusListProps {
  /**
   * Ordered list of role names that must sign off.
   * Each entry is a plain role string, e.g. "admin", "manager", "reviewer".
   */
  required: string[];
  /**
   * Completed decisions — approvals or rejections that have been recorded.
   * Matched against `required` by `approverRole`.
   */
  given: ApprovalDecision[];
}

type RowState = "approved" | "rejected" | "pending";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Capitalize and title-case a raw role string for display. */
function formatRoleLabel(role: string): string {
  return role
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Derive up-to-two initials from a display name.
 * Falls back to the first character of the role label.
 */
function getInitials(name: string | undefined, fallback: string): string {
  if (!name) return fallback.charAt(0).toUpperCase();
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─── Sub-component: Initials circle ──────────────────────────────────────────

interface InitialsCircleProps {
  initials: string;
  state: RowState;
}

function InitialsCircle({ initials, state }: InitialsCircleProps) {
  const colorClass =
    state === "approved"
      ? "bg-green-100 text-green-700"
      : state === "rejected"
        ? "bg-red-100 text-red-700"
        : "bg-slate-100 text-slate-500";

  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold select-none ${colorClass}`}
    >
      {initials}
    </span>
  );
}

// ─── Sub-component: State indicator icon ─────────────────────────────────────

interface StateIconProps {
  state: RowState;
}

function StateIcon({ state }: StateIconProps) {
  if (state === "approved") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20"
        data-testid="state-icon-approved"
      >
        <CheckCircle2 size={14} aria-hidden="true" />
        <span>Approved</span>
      </span>
    );
  }

  if (state === "rejected") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20"
        data-testid="state-icon-rejected"
      >
        <XCircle size={14} aria-hidden="true" />
        <span>Rejected</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20"
      data-testid="state-icon-pending"
    >
      <Clock size={14} aria-hidden="true" />
      <span>Pending</span>
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * ApprovalStatusList
 *
 * Renders one row per required approver role showing:
 * - Initials circle (derived from the approver's recorded name, or role label)
 * - Human-readable role label
 * - Decision state indicator (pending / approved / rejected)
 *
 * State is derived internally by cross-referencing `given` against `required`.
 * Pending rows are rendered with reduced opacity to visually distinguish them.
 */
export function ApprovalStatusList({
  required,
  given,
}: ApprovalStatusListProps) {
  if (required.length === 0) return null;

  // Build a lookup from role → completed decision (case-insensitive).
  const givenByRole = new Map<string, ApprovalDecision>();
  for (const decision of given) {
    givenByRole.set(decision.approverRole.toLowerCase(), decision);
  }

  return (
    <ul
      className="space-y-2"
      aria-label="Approver status list"
      data-testid="approval-status-list"
    >
      {required.map((role) => {
        const normalizedRole = role.toLowerCase();
        const decision = givenByRole.get(normalizedRole);

        let state: RowState = "pending";
        if (decision) {
          if (decision.status === "APPROVED") state = "approved";
          else if (decision.status === "REJECTED") state = "rejected";
          // EXPIRED falls through to "pending" visually
        }

        const roleLabel = formatRoleLabel(role);
        const initials = getInitials(decision?.approverName, roleLabel);
        const isPending = state === "pending";

        return (
          <li
            key={role}
            aria-label={`Approval status for ${roleLabel}`}
            data-testid={`approval-row-${normalizedRole}`}
            className={`flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-opacity ${
              isPending ? "opacity-60" : "opacity-100"
            }`}
          >
            {/* Left: avatar + role label */}
            <div className="flex items-center gap-3 min-w-0">
              <InitialsCircle initials={initials} state={state} />
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    isPending ? "text-slate-400" : "text-slate-900"
                  }`}
                >
                  {roleLabel}
                </p>
                {decision?.approverName && (
                  <p className="text-xs text-slate-500 truncate">
                    {decision.approverName}
                  </p>
                )}
              </div>
            </div>

            {/* Right: state indicator */}
            <StateIcon state={state} />
          </li>
        );
      })}
    </ul>
  );
}
