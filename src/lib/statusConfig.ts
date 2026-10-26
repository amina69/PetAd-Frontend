import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Banknote,
  CheckCircle2,
  CircleDashed,
  FileText,
  Hourglass,
  Loader2,
  Lock,
  LockOpen,
  Scale,
  ShieldCheck,
  TimerOff,
  Undo2,
  Wallet,
  XCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";

import type { AdoptionStatus, CustodyStatus, DecisionStatus } from "../types/adoption";
import type { ApprovalStatus, ApprovalStatusCode } from "../types/approval";
import type {
  DisputeEscrowStatus,
  DisputeSlaStatus,
  DisputeStatus as DisputeRecordStatus,
  DisputeStatusCode,
} from "../types/dispute";
import type {
  EscrowLifecycleStatus,
  EscrowRecordStatus,
  EscrowStatus,
} from "../types/escrow";
import type { CustodyStatus as CustodyRequestStatus } from "../features/custody/types/custody";

/**
 * Status colour tokens.
 *
 * These are the six Figma status colours the design system exposes. They map
 * 1:1 onto the `status-badge--*` variants defined in `src/index.css`, so a
 * component never needs to know the underlying Tailwind shades.
 */
export type StatusColorToken =
  | "gray"
  | "blue"
  | "teal"
  | "green"
  | "amber"
  | "red";

/** Everything a status badge needs in order to render itself. */
export interface StatusMeta {
  /** Human readable label shown inside the badge. */
  label: string;
  /** Longer explanation, rendered as the badge tooltip. */
  description: string;
  /** Figma colour token driving the badge variant. */
  color: StatusColorToken;
  /** Icon rendered inside the badge. */
  icon: LucideIcon;
  /** Whether the badge should pulse (used for breach/attention states). */
  pulse?: boolean;
}

/**
 * Status domains.
 *
 * Every status vocabulary used by the app is listed here. The union of the
 * source types is what makes the badge map exhaustive: adding a status to any
 * of those unions widens {@link StatusKey} and therefore breaks the type-check
 * of {@link STATUS_CONFIG} until a matching entry is added.
 */
export interface StatusDomainMap {
  /** Adoption requests and approval decisions. */
  approval: ApprovalStatusCode | DecisionStatus;
  /** Adoption (escrow) lifecycle. */
  adoption: AdoptionStatus;
  /** Temporary custody lifecycle. */
  custody: CustodyStatus | CustodyRequestStatus;
  /** Disputes raised against an adoption or custody. */
  dispute: DisputeStatusCode;
  /** Escrow records, escrow lifecycle and escrow state within a dispute. */
  escrow:
    | EscrowStatus
    | EscrowLifecycleStatus
    | EscrowRecordStatus
    | DisputeEscrowStatus;
  /** SLA health of a dispute. */
  sla: DisputeSlaStatus;
}

export type StatusDomain = keyof StatusDomainMap;

/** Every valid `"<domain>:<status>"` key of {@link STATUS_CONFIG}. */
export type StatusKey = {
  [Domain in StatusDomain]: `${Domain}:${StatusDomainMap[Domain]}`;
}[StatusDomain];

/**
 * Single source of truth for status labels, colours and icons.
 *
 * The map is typed as `Record<StatusKey, StatusMeta>`, which gives us the
 * exhaustiveness guarantee for free: a status that exists in the domain types
 * but has no entry here is a type error, and an entry for a status that does
 * not exist is an excess-property error.
 */
export const STATUS_CONFIG = {
  // ─── Approval ─────────────────────────────────────────────────────────────
  "approval:PENDING": {
    label: "Pending",
    description: "The request is waiting for a decision.",
    color: "amber",
    icon: Clock,
  },
  "approval:APPROVED": {
    label: "Approved",
    description: "The request was approved.",
    color: "green",
    icon: CheckCircle2,
  },
  "approval:REJECTED": {
    label: "Rejected",
    description: "The request was rejected.",
    color: "red",
    icon: XCircle,
  },
  "approval:EXPIRED": {
    label: "Expired",
    description: "The request expired before a decision was made.",
    color: "gray",
    icon: TimerOff,
  },
  "approval:DISPUTED": {
    label: "Disputed",
    description: "The request is under dispute.",
    color: "red",
    icon: Scale,
  },
  "approval:SHELTER_APPROVED": {
    label: "Shelter Approved",
    description: "The shelter approved the request.",
    color: "green",
    icon: CheckCircle2,
  },
  "approval:ADMIN_APPROVED": {
    label: "Admin Approved",
    description: "An administrator approved the request.",
    color: "teal",
    icon: BadgeCheck,
  },

  // ─── Adoption ─────────────────────────────────────────────────────────────
  "adoption:ESCROW_CREATED": {
    label: "Escrow Created",
    description: "Escrow has been created but not funded yet.",
    color: "gray",
    icon: FileText,
  },
  "adoption:ESCROW_FUNDED": {
    label: "Escrow Funded",
    description: "Funds have been deposited into escrow.",
    color: "teal",
    icon: Wallet,
  },
  "adoption:SETTLEMENT_TRIGGERED": {
    label: "Settlement Triggered",
    description: "Settlement process has started.",
    color: "amber",
    icon: Hourglass,
  },
  "adoption:CUSTODY_ACTIVE": {
    label: "Custody Active",
    description: "Pet custody is currently active.",
    color: "green",
    icon: ShieldCheck,
  },
  "adoption:FUNDS_RELEASED": {
    label: "Funds Released",
    description: "Funds have been released successfully.",
    color: "green",
    icon: Banknote,
  },
  "adoption:COMPLETED": {
    label: "Completed",
    description: "The adoption lifecycle has been completed.",
    color: "green",
    icon: CheckCircle2,
  },
  "adoption:CANCELLED": {
    label: "Cancelled",
    description: "The adoption was cancelled before completion.",
    color: "gray",
    icon: Ban,
  },
  "adoption:DISPUTED": {
    label: "Disputed",
    description: "There is a dispute in the adoption.",
    color: "red",
    icon: Scale,
  },
  "adoption:EXPIRING_SOON": {
    label: "Expiring Soon",
    description: "The adoption is close to ending and requires attention.",
    color: "amber",
    icon: AlertTriangle,
  },

  // ─── Custody ──────────────────────────────────────────────────────────────
  "custody:PENDING": {
    label: "Pending",
    description: "Custody is pending and has not started yet.",
    color: "gray",
    icon: Clock,
  },
  "custody:DEPOSIT_PENDING": {
    label: "Deposit Pending",
    description: "Custody deposit is awaiting payment confirmation.",
    color: "blue",
    icon: Wallet,
  },
  "custody:DEPOSIT_CONFIRMED": {
    label: "Deposit Confirmed",
    description: "Custody deposit has been confirmed.",
    color: "teal",
    icon: BadgeCheck,
  },
  "custody:ACTIVE": {
    label: "Active",
    description: "Custody is currently active.",
    color: "green",
    icon: ShieldCheck,
  },
  "custody:EXPIRING_SOON": {
    label: "Expiring Soon",
    description: "Custody is close to ending and requires attention.",
    color: "amber",
    icon: AlertTriangle,
  },
  "custody:COMPLETING": {
    label: "Completing",
    description: "Custody is in the completion process.",
    color: "amber",
    icon: Loader2,
  },
  "custody:COMPLETED": {
    label: "Completed",
    description: "Custody has been completed successfully.",
    color: "green",
    icon: CheckCircle2,
  },
  "custody:DISPUTED": {
    label: "Disputed",
    description: "A dispute has been raised for this custody.",
    color: "red",
    icon: Scale,
  },
  "custody:CANCELLED": {
    label: "Cancelled",
    description: "Custody was cancelled before completion.",
    color: "gray",
    icon: Ban,
  },

  // ─── Custody (request lifecycle vocabulary) ───────────────────────────────
  // The custody feature models a request in lowercase (`requested`, `approved`,
  // …) while the custody views use the uppercase lifecycle codes above. Both
  // are rendered from this map so a custody record looks the same either way.
  "custody:requested": {
    label: "Requested",
    description: "The custody request has been sent and is awaiting review.",
    color: "amber",
    icon: Hourglass,
  },
  "custody:approved": {
    label: "Approved",
    description: "The custody request was approved.",
    color: "green",
    icon: BadgeCheck,
  },
  "custody:active": {
    label: "Active",
    description: "Custody is currently active.",
    color: "green",
    icon: ShieldCheck,
  },
  "custody:completed": {
    label: "Completed",
    description: "Custody has been completed successfully.",
    color: "green",
    icon: CheckCircle2,
  },
  "custody:cancelled": {
    label: "Cancelled",
    description: "Custody was cancelled before completion.",
    color: "gray",
    icon: Ban,
  },
  "custody:disputed": {
    label: "Disputed",
    description: "A dispute has been raised for this custody.",
    color: "red",
    icon: Scale,
  },

  // ─── Dispute ──────────────────────────────────────────────────────────────
  "dispute:OPEN": {
    label: "Open",
    description: "Dispute has been created and awaits review.",
    color: "amber",
    icon: Scale,
  },
  "dispute:UNDER_REVIEW": {
    label: "Under Review",
    description: "Dispute is currently being reviewed.",
    color: "blue",
    icon: CircleDashed,
  },
  "dispute:RESOLVED": {
    label: "Resolved",
    description: "Dispute has been resolved successfully.",
    color: "green",
    icon: CheckCircle2,
  },
  "dispute:CLOSED": {
    label: "Closed",
    description: "Dispute has been closed.",
    color: "gray",
    icon: Lock,
  },
  "dispute:REJECTED": {
    label: "Rejected",
    description: "The dispute was rejected.",
    color: "red",
    icon: XCircle,
  },
  "dispute:SLA_BREACHED": {
    label: "SLA Breached",
    description: "Resolution SLA time has been exceeded.",
    color: "red",
    icon: AlertTriangle,
    pulse: true,
  },

  // ─── Escrow ───────────────────────────────────────────────────────────────
  "escrow:AWAITING_FUNDS": {
    label: "Awaiting Funds",
    description: "The escrow has not been funded yet.",
    color: "amber",
    icon: Wallet,
  },
  "escrow:CREATED": {
    label: "Created",
    description: "Escrow has been created but not yet funded.",
    color: "gray",
    icon: FileText,
  },
  "escrow:FUNDED": {
    label: "Funded",
    description: "Funds have been deposited into escrow.",
    color: "blue",
    icon: Banknote,
  },
  "escrow:CONFIRMED": {
    label: "Confirmed",
    description: "Transaction has been confirmed by the parties.",
    color: "teal",
    icon: BadgeCheck,
  },
  "escrow:IN_REVIEW": {
    label: "In Review",
    description: "The escrow transfer is under review.",
    color: "teal",
    icon: CircleDashed,
  },
  "escrow:SETTLING": {
    label: "Settling",
    description: "Funds are currently being processed for settlement.",
    color: "amber",
    icon: Loader2,
  },
  "escrow:SETTLED": {
    label: "Settled",
    description: "Escrow has been successfully settled.",
    color: "green",
    icon: CheckCircle2,
  },
  "escrow:SETTLEMENT_FAILED": {
    label: "Settlement Failed",
    description: "Settlement failed. Funds were not successfully transferred.",
    color: "red",
    icon: XCircle,
  },
  "escrow:DISPUTED": {
    label: "Disputed",
    description: "A dispute has been raised for this escrow.",
    color: "red",
    icon: Scale,
  },
  "escrow:NOT_FOUND": {
    label: "Not Found",
    description: "Escrow record could not be found.",
    color: "gray",
    icon: CircleDashed,
  },
  "escrow:LOCKED": {
    label: "Locked",
    description: "Escrow funds are locked while the dispute is open.",
    color: "amber",
    icon: Lock,
  },
  "escrow:RELEASED": {
    label: "Released",
    description: "Escrow funds have been released.",
    color: "green",
    icon: LockOpen,
  },
  "escrow:REFUNDED": {
    label: "Refunded",
    description: "Escrow funds have been refunded.",
    color: "gray",
    icon: Undo2,
  },

  // ─── SLA ──────────────────────────────────────────────────────────────────
  "sla:ON_TIME": {
    label: "On Time",
    description: "The dispute is still within its resolution SLA.",
    color: "green",
    icon: CheckCircle2,
  },
  "sla:AT_RISK": {
    label: "At Risk",
    description: "The dispute is close to breaching its resolution SLA.",
    color: "amber",
    icon: AlertTriangle,
  },
  "sla:BREACHED": {
    label: "Breached",
    description: "The resolution SLA has been exceeded.",
    color: "red",
    icon: AlertTriangle,
    pulse: true,
  },
} as const satisfies Record<StatusKey, StatusMeta>;

/**
 * Lowercase status codes still returned by some list endpoints, mapped onto
 * their canonical counterpart so both spellings render the same badge.
 *
 * `satisfies Record<...>` keeps these aliases exhaustive: adding a lowercase
 * status without an alias is a type error.
 */
export const APPROVAL_STATUS_ALIASES = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
} as const satisfies Record<ApprovalStatus, ApprovalStatusCode>;

export const DISPUTE_STATUS_ALIASES = {
  open: "OPEN",
  under_review: "UNDER_REVIEW",
  resolved: "RESOLVED",
  closed: "CLOSED",
} as const satisfies Record<DisputeRecordStatus, DisputeStatusCode>;

/** Legacy (lowercase) aliases per domain. */
const STATUS_ALIASES: Partial<
  Record<StatusDomain, Record<string, string>>
> = {
  approval: APPROVAL_STATUS_ALIASES,
  dispute: DISPUTE_STATUS_ALIASES,
};

/** Rendered when a status is not part of the config (e.g. an unknown API value). */
export const UNKNOWN_STATUS_META: StatusMeta = {
  label: "Not Found",
  description: "Unknown status.",
  color: "gray",
  icon: CircleDashed,
};

/**
 * Resolve the config key for a status, following the legacy aliases.
 *
 * @returns the matching key, or `null` when the status is unknown.
 */
export function resolveStatusKey(
  domain: StatusDomain,
  status: string,
): StatusKey | null {
  const direct = `${domain}:${status}`;
  if (direct in STATUS_CONFIG) {
    return direct as StatusKey;
  }

  const alias = STATUS_ALIASES[domain]?.[status];
  if (alias) {
    const aliased = `${domain}:${alias}`;
    if (aliased in STATUS_CONFIG) {
      return aliased as StatusKey;
    }
  }

  return null;
}

/**
 * Look up the label, colour and icon of a status.
 *
 * Unknown statuses fall back to {@link UNKNOWN_STATUS_META} so a badge never
 * renders empty.
 */
export function getStatusMeta(
  domain: StatusDomain,
  status: string,
): StatusMeta {
  const key = resolveStatusKey(domain, status);
  if (!key) {
    return UNKNOWN_STATUS_META;
  }

  return STATUS_CONFIG[key] as StatusMeta;
}

/**
 * Tailwind utilities for a colour token.
 *
 * Used by the few components that cannot render the shared `StatusBadge`
 * primitive (e.g. the interactive filter chips) so they still use the exact
 * same colours as every other status badge.
 */
export interface StatusColorClasses {
  /** Solid background, e.g. `bg-red-100`. */
  bg: string;
  /** Foreground colour, e.g. `text-red-700`. */
  text: string;
  /** Border colour, e.g. `border-red-200`. */
  border: string;
  /** Tinted background, e.g. `bg-red-50`. */
  softBg: string;
  /** Focus ring colour, e.g. `ring-red-600/20`. */
  ring: string;
  /** Hover background, e.g. `hover:bg-red-200`. */
  hoverBg: string;
}

/** Colour token → Tailwind utilities. */
export const STATUS_COLOR_CLASSES = {
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    softBg: "bg-gray-50",
    ring: "ring-gray-600/20",
    hoverBg: "hover:bg-gray-200",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    softBg: "bg-blue-50",
    ring: "ring-blue-600/20",
    hoverBg: "hover:bg-blue-200",
  },
  teal: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    border: "border-teal-200",
    softBg: "bg-teal-50",
    ring: "ring-teal-600/20",
    hoverBg: "hover:bg-teal-200",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    softBg: "bg-green-50",
    ring: "ring-green-600/20",
    hoverBg: "hover:bg-green-200",
  },
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    softBg: "bg-amber-50",
    ring: "ring-amber-600/20",
    hoverBg: "hover:bg-amber-200",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    softBg: "bg-red-50",
    ring: "ring-red-600/20",
    hoverBg: "hover:bg-red-200",
  },
} as const satisfies Record<StatusColorToken, StatusColorClasses>;

/**
 * SLA health is derived rather than stored, so it is not part of the domain
 * unions. It still lives here so the label/colour/icon stay consistent with
 * the rest of the dispute badges.
 */
export const SLA_HEALTHY_META: StatusMeta = {
  label: "Within SLA",
  description: "The dispute is still within its resolution SLA.",
  color: "green",
  icon: CheckCircle2,
};
