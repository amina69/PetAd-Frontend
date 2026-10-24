import type { ApprovalDecision } from "../../types/adoption";
import {
  getStatusMeta,
  STATUS_COLOR_CLASSES,
} from "../../lib/statusConfig";

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

/** Approval status code backing each row state. */
const ROW_STATE_STATUS: Record<RowState, string> = {
  approved: "APPROVED",
  rejected: "REJECTED",
  pending: "PENDING",
};

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
  const tokenClasses = STATUS_COLOR_CLASSES[
    getStatusMeta("approval", ROW_STATE_STATUS[state]).color
  ];
  const colorClass = `${tokenClasses.bg} ${tokenClasses.text}`;

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
  const meta = getStatusMeta("approval", ROW_STATE_STATUS[state]);
  const Icon = meta.icon;
  const tokenClasses = STATUS_COLOR_CLASSES[meta.color];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${tokenClasses.softBg} px-2.5 py-1 text-xs font-semibold ${tokenClasses.text} ring-1 ring-inset ${tokenClasses.ring}`}
      data-testid={`state-icon-${state}`}
    >
      <Icon size={14} aria-hidden="true" />
      <span>{meta.label}</span>
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
