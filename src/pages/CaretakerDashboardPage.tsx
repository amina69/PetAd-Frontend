import { useCallback, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Inbox,
  XCircle,
} from "lucide-react";

import { DisputeStatusBadge } from "../components/dispute/DisputeStatusBadge";
import { EmptyState } from "../components/ui/emptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { approvalService } from "../features/approval/api/approvalService";
import {
  approvalKeys,
  useApprovalList,
} from "../features/approval/hooks/useApprovalList";
import { rejectRequestSchema } from "../features/approval/schemas/approvalSchemas";
import type {
  ApprovalItem,
  ApprovalListResponse,
} from "../features/approval/types/approval.types";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { useDisputes } from "../hooks/useDisputes";
import type { Dispute } from "../types/dispute";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

/** Maximum rows rendered in the dispute/handover widgets. */
const WIDGET_LIMIT = 4;

/** How many pending requests the dashboard asks the API for. */
const REQUEST_FETCH_LIMIT = 5;

// ─── Custody arrangement fixtures ────────────────────────────────────────────

interface CustodyArrangement {
  id: string;
  petName: string;
  ownerName: string;
  location: string;
  startDate: string;
  endDate: string;
}

function isoOffset(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

/**
 * Fixture-backed custody arrangements for the "Active arrangements" and
 * "Upcoming handovers" widgets.
 *
 * The backend does not expose a *list* custody endpoint yet — `custodyService`
 * only offers `GET /api/custody/:id` and `GET /api/custody/:id/timeline`
 * (see docs/local-dev.md → MSW coverage). Dates are seeded relative to now so
 * the "days remaining" maths and the handover ordering stay deterministic in
 * tests. Swap this constant for a `useQuery` against the future list endpoint;
 * the widget markup does not change.
 */
const SEED_ARRANGEMENTS: CustodyArrangement[] = [
  {
    id: "custody-1",
    petName: "Luna",
    ownerName: "Grace Mensah",
    location: "Northside apartment",
    startDate: isoOffset(-4),
    endDate: isoOffset(3),
  },
  {
    id: "custody-3",
    petName: "Milo",
    ownerName: "Ana Ruiz",
    location: "Riverside vet clinic",
    startDate: isoOffset(-6),
    endDate: isoOffset(1),
  },
  {
    id: "custody-2",
    petName: "Buddy",
    ownerName: "Samuel Okoye",
    location: "Happy Paws shelter",
    startDate: isoOffset(-1),
    endDate: isoOffset(6),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Whole days left before `endDate`; 0 means the handover is due today. */
function daysRemaining(endDate: string): number {
  const remainingMs = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / DAY_MS));
}

/** Days a request has been waiting, preferring a server-provided value. */
function daysWaiting(item: ApprovalItem): number | null {
  if (typeof item.daysWaiting === "number") {
    return item.daysWaiting;
  }
  if (!item.submittedAt) {
    return null;
  }
  const elapsed = Date.now() - new Date(item.submittedAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    return 0;
  }
  return Math.floor(elapsed / DAY_MS);
}

/** Normalises the many status spellings the API uses to an upper-case value. */
function requestStatus(item: ApprovalItem): string {
  return typeof item.status === "string" ? item.status.toUpperCase() : "PENDING";
}

function requestTypeLabel(item: ApprovalItem): string {
  const type = item.type;
  return typeof type === "string" && type === "adoption" ? "Adoption" : "Custody";
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function errorMessageOf(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong while saving your decision. Please try again.";
}

// ─── Decision payload ────────────────────────────────────────────────────────

type DecisionPayload =
  | { id: string; decision: "APPROVED" }
  | { id: string; decision: "REJECTED"; reason: string };

// ─── Widget shell ────────────────────────────────────────────────────────────

interface WidgetShellProps {
  testId: string;
  title: string;
  meta?: string;
  icon: ReactNode;
  count?: number;
  children: ReactNode;
}

function WidgetShell({ testId, title, meta, icon, count, children }: WidgetShellProps) {
  return (
    <section
      data-testid={testId}
      aria-labelledby={`${testId}-heading`}
      className="flex flex-col rounded-xl border border-[#EBEDF0] bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF2E5] text-[#E84D2A]"
          >
            {icon}
          </span>
          <div>
            <h2
              id={`${testId}-heading`}
              className="text-[18px] font-semibold text-[#0D162B]"
            >
              {title}
            </h2>
            {meta ? (
              <p className="text-[13px] text-[#667085]">{meta}</p>
            ) : null}
          </div>
        </div>
        {typeof count === "number" ? (
          <span
            data-testid={`${testId}-count`}
            className="shrink-0 rounded-full bg-[#0D162B] px-2.5 py-1 text-[12px] font-bold text-white"
          >
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

// ─── Approval modal (issue 7) ────────────────────────────────────────────────

interface ApprovalModalProps {
  request: ApprovalItem;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (payload: DecisionPayload) => void;
  onClose: () => void;
}

/**
 * In-place approval modal opened from the dashboard's quick actions.
 *
 * Renders over the dashboard (no navigation), traps focus, closes on Escape,
 * and validates the rejection reason with the same `rejectRequestSchema` the
 * API layer uses.
 */
function ApprovalModal({
  request,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: ApprovalModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  useDialogFocus(true, dialogRef, onClose);

  const petName = request.petName ?? "Unknown pet";
  const applicant = request.applicantName ?? "Unknown applicant";
  const waiting = daysWaiting(request);

  function handleRejectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = rejectRequestSchema.safeParse({ reason });
    if (!parsed.success) {
      setReasonError(
        parsed.error.issues[0]?.message ??
          "Please provide at least 20 characters explaining the rejection",
      );
      return;
    }
    setReasonError(null);
    onSubmit({ id: request.id, decision: "REJECTED", reason: parsed.data.reason });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="approval-modal-backdrop"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        data-testid="approval-modal"
        className="relative max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white shadow-2xl focus:outline-none"
      >
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF2E5] text-[#E84D2A]"
            >
              <ClipboardCheck size={20} />
            </span>
            <div>
              <h2 id={titleId} className="text-[20px] font-bold text-[#0D162B]">
                Review custody request
              </h2>
              <p className="text-[13px] text-[#667085]">
                Approving starts the arrangement. This happens here — you stay on
                your dashboard.
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-[#ECEFF3] bg-gray-50 p-4 text-[13px]">
            <div>
              <dt className="text-[#667085]">Pet</dt>
              <dd className="font-semibold text-[#0D162B]" data-testid="modal-pet-name">
                {petName}
              </dd>
            </div>
            <div>
              <dt className="text-[#667085]">Requested by</dt>
              <dd className="font-semibold text-[#0D162B]">{applicant}</dd>
            </div>
            <div>
              <dt className="text-[#667085]">Type</dt>
              <dd className="font-semibold text-[#0D162B]">
                {requestTypeLabel(request)} custody
              </dd>
            </div>
            <div>
              <dt className="text-[#667085]">Submitted</dt>
              <dd className="font-semibold text-[#0D162B]">
                {request.submittedAt ? formatDate(request.submittedAt) : "—"}
                {waiting !== null ? ` · waiting ${waiting}d` : ""}
              </dd>
            </div>
          </dl>

          {errorMessage ? (
            <p
              role="alert"
              data-testid="approval-error"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700"
            >
              {errorMessage}
            </p>
          ) : null}

          {showRejectForm ? (
            <form onSubmit={handleRejectSubmit} className="space-y-3" noValidate>
              <label
                htmlFor={`${titleId}-reason`}
                className="block text-[13px] font-semibold text-[#0D162B]"
              >
                Rejection reason
              </label>
              <textarea
                id={`${titleId}-reason`}
                data-testid="rejection-reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (reasonError) setReasonError(null);
                }}
                rows={4}
                placeholder="Explain why this custody request is being rejected (at least 20 characters)"
                aria-invalid={reasonError ? true : undefined}
                className={`w-full resize-y rounded-lg border px-3 py-2 text-[14px] text-[#0D162B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E84D2A]/40 ${
                  reasonError ? "border-red-400" : "border-gray-300"
                }`}
              />
              {reasonError ? (
                <p
                  role="alert"
                  data-testid="rejection-reason-error"
                  className="text-[13px] font-medium text-red-600"
                >
                  {reasonError}
                </p>
              ) : null}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 rounded-xl border-2 border-gray-300 py-2.5 text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  data-testid="submit-rejection"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting…" : "Submit rejection"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                data-testid="approve-request"
                onClick={() => onSubmit({ id: request.id, decision: "APPROVED" })}
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E84D2A] py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#d4431f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                {isSubmitting ? "Saving…" : "Approve request"}
              </button>
              <button
                type="button"
                data-testid="reject-request"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-500 py-3 text-[14px] font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle size={16} aria-hidden="true" />
                Reject
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl px-4 py-3 text-[14px] font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

/**
 * CaretakerDashboardPage
 *
 * Caretaker home base. Renders four widgets:
 *
 * 1. Incoming custody requests awaiting action — live data from
 *    `useApprovalList`, with quick actions that open the Approval modal
 *    (issue 7) *in place* instead of navigating away.
 * 2. Active arrangements with days remaining.
 * 3. Upcoming handovers (arrangements ordered by their end date).
 * 4. Open disputes from `useDisputes({ status: "open" })`.
 *
 * Approving or rejecting from the modal updates the requests widget
 * optimistically, so the widget reflects the decision without leaving the page.
 */
export default function CaretakerDashboardPage() {
  const queryClient = useQueryClient();
  const [activeRequest, setActiveRequest] = useState<ApprovalItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // ── Incoming custody requests awaiting action ──────────────────────────────
  const requestParams = useMemo(
    () => ({ status: "PENDING", type: "custody", limit: REQUEST_FETCH_LIMIT }),
    [],
  );
  const approvalsQuery = useApprovalList(requestParams);

  const awaitingRequests = useMemo(
    () =>
      (approvalsQuery.data?.items ?? []).filter(
        (item) => requestStatus(item) === "PENDING",
      ),
    [approvalsQuery.data],
  );

  // ── Open disputes ─────────────────────────────────────────────────────────
  const disputesQuery = useDisputes({ status: "open" });
  const openDisputes = useMemo(
    () => disputesQuery.disputes.slice(0, WIDGET_LIMIT),
    [disputesQuery.disputes],
  );

  // ── Active arrangements & upcoming handovers ──────────────────────────────
  const upcomingHandovers = useMemo(
    () =>
      SEED_ARRANGEMENTS.filter(
        (arrangement) => new Date(arrangement.endDate).getTime() > Date.now(),
      )
        .sort(
          (a, b) =>
            new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
        )
        .slice(0, WIDGET_LIMIT),
    [],
  );

  // ── Approval decision mutation ────────────────────────────────────────────
  const decisionMutation = useMutation({
    mutationFn: (payload: DecisionPayload) =>
      payload.decision === "APPROVED"
        ? approvalService.approveRequest(payload.id)
        : approvalService.rejectRequest(payload.id, { reason: payload.reason }),

    // Optimistically flag the request as decided so the dashboard widget
    // updates immediately, without waiting for a refetch (and without
    // navigating away from the page).
    onMutate: async (payload: DecisionPayload) => {
      await queryClient.cancelQueries({ queryKey: approvalKeys.all });
      const previous = queryClient.getQueriesData<ApprovalListResponse>({
        queryKey: approvalKeys.all,
      });
      queryClient.setQueriesData<ApprovalListResponse>(
        { queryKey: approvalKeys.all },
        (cached) =>
          cached
            ? {
                ...cached,
                items: (cached.items ?? []).map((item) =>
                  item.id === payload.id
                    ? { ...item, status: payload.decision }
                    : item,
                ),
              }
            : cached,
      );
      return { previous };
    },

    onError: (_error, _payload, context) => {
      // Roll back the optimistic update so the widget shows server truth again.
      // The failure itself is surfaced inside the modal via `decisionMutation`.
      for (const [key, value] of context?.previous ?? []) {
        queryClient.setQueryData(key, value);
      }
      setNotice(null);
    },

    onSuccess: (_response, payload) => {
      const petName = activeRequest?.petName ?? "The";
      setNotice(
        payload.decision === "APPROVED"
          ? `${petName}'s custody request was approved. The widget below has been updated.`
          : `${petName}'s custody request was rejected.`,
      );
    },

    onSettled: () => {
      // Mark the approvals queries stale for the next fetch without refetching
      // right now: an immediate refetch would race the optimistic update above.
      queryClient.invalidateQueries({
        queryKey: approvalKeys.all,
        refetchType: "none",
      });
    },
  });

  const closeModal = useCallback(() => setActiveRequest(null), []);

  function handleDecision(payload: DecisionPayload) {
    decisionMutation.mutate(payload, {
      onSuccess: () => setActiveRequest(null),
    });
  }

  function handleReviewNext() {
    const next = awaitingRequests[0];
    if (next) {
      setActiveRequest(next);
    }
  }

  const decisionError = decisionMutation.isError
    ? errorMessageOf(decisionMutation.error)
    : null;

  return (
    <div className="min-h-full bg-[#F8FAFC] py-6 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[#0D162B]">
              Caretaker Dashboard
            </h1>
            <p className="mt-1 text-[16px] text-[#475467]">
              Custody requests, active arrangements, handovers and open disputes
              in one place.
            </p>
          </div>
          <button
            type="button"
            data-testid="review-next-request"
            onClick={handleReviewNext}
            disabled={awaitingRequests.length === 0}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#E84D2A] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#d4431f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E84D2A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <ClipboardCheck size={16} aria-hidden="true" />
            Review next request
          </button>
        </div>

        {notice ? (
          <p
            role="status"
            aria-live="polite"
            data-testid="dashboard-notice"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] font-medium text-emerald-800"
          >
            {notice}
          </p>
        ) : null}

        {/* ── Widgets ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Incoming custody requests awaiting action */}
          <div className="lg:col-span-2">
            <WidgetShell
              testId="custody-requests-widget"
              title="Incoming custody requests"
              meta="Awaiting your action"
              icon={<Inbox size={20} aria-hidden="true" />}
              count={awaitingRequests.length}
            >
              {approvalsQuery.isLoading ? (
                <div
                  className="flex flex-col gap-3"
                  data-testid="custody-requests-loading"
                  aria-hidden="true"
                >
                  <Skeleton variant="row" className="h-14" />
                  <Skeleton variant="row" className="h-14" />
                </div>
              ) : approvalsQuery.isError ? (
                <EmptyState
                  title="Custody requests unavailable"
                  description="We could not load your custody requests. Please try again."
                  action={{
                    label: "Retry",
                    onClick: () => void approvalsQuery.refetch(),
                  }}
                />
              ) : awaitingRequests.length === 0 ? (
                <EmptyState
                  title="No custody requests waiting"
                  description="New custody requests addressed to you will appear here for review."
                />
              ) : (
                <ul
                  role="list"
                  aria-label="Custody requests awaiting action"
                  className="flex flex-col divide-y divide-gray-100"
                >
                  {awaitingRequests.map((item) => {
                    const waiting = daysWaiting(item);
                    return (
                      <li
                        key={item.id}
                        data-testid={`custody-request-${item.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600"
                          >
                            {(item.petName ?? "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#0D162B]">
                              {item.petName ?? "Unknown pet"}
                            </p>
                            <p className="truncate text-xs text-[#667085]">
                              {requestTypeLabel(item)} request ·{" "}
                              {item.applicantName ?? "Unknown applicant"}
                              {waiting !== null ? ` · waiting ${waiting}d` : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          data-testid={`review-request-${item.id}`}
                          aria-label={`Review request for ${item.petName ?? "pet"}`}
                          onClick={() => setActiveRequest(item)}
                          className="shrink-0 rounded-lg border border-[#E84D2A] px-3.5 py-1.5 text-[13px] font-semibold text-[#E84D2A] transition-colors hover:bg-[#FFF2E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E84D2A] focus-visible:ring-offset-1"
                        >
                          Review
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </WidgetShell>
          </div>

          {/* Open disputes */}
          <WidgetShell
            testId="open-disputes-widget"
            title="Open disputes"
            meta="Open cases needing attention"
            icon={<AlertTriangle size={20} aria-hidden="true" />}
            count={disputesQuery.disputes.length}
          >
            {disputesQuery.isLoading ? (
              <div
                className="flex flex-col gap-3"
                data-testid="open-disputes-loading"
                aria-hidden="true"
              >
                <Skeleton variant="row" className="h-14" />
                <Skeleton variant="row" className="h-14" />
              </div>
            ) : disputesQuery.isError ? (
              <EmptyState
                title="Disputes unavailable"
                description="We could not load your open disputes. Please try again."
                action={{
                  label: "Retry",
                  onClick: () => void disputesQuery.refetch(),
                }}
              />
            ) : openDisputes.length === 0 ? (
              <EmptyState
                title="No open disputes"
                description="Disputes you are involved in will appear here while they are open."
              />
            ) : (
              <ul
                role="list"
                aria-label="Open disputes"
                className="flex flex-col divide-y divide-gray-100"
              >
                {openDisputes.map((dispute: Dispute) => (
                  <li key={dispute.id}>
                    <Link
                      to={`/disputes/${dispute.id}`}
                      data-testid={`open-dispute-${dispute.id}`}
                      className="group flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0D162B] transition-colors group-hover:text-[#E84D2A]">
                          {dispute.pet.name}
                        </p>
                        <p className="truncate text-xs text-[#667085]">
                          {titleCase(dispute.reason)} · {formatDate(dispute.createdAt)}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-2">
                        <DisputeStatusBadge status={dispute.status} />
                        <ArrowRight
                          size={16}
                          aria-hidden="true"
                          className="text-gray-300 transition-colors group-hover:text-[#E84D2A]"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </WidgetShell>

          {/* Active arrangements */}
          <div className="lg:col-span-2">
            <WidgetShell
              testId="active-arrangements-widget"
              title="Active arrangements"
              meta="Time left on each active placement"
              icon={<Clock size={20} aria-hidden="true" />}
              count={SEED_ARRANGEMENTS.length}
            >
              <ul
                role="list"
                aria-label="Active custody arrangements"
                className="flex flex-col divide-y divide-gray-100"
              >
                {SEED_ARRANGEMENTS.map((arrangement) => {
                  const remaining = daysRemaining(arrangement.endDate);
                  const badgeClass =
                    remaining <= 1
                      ? "bg-red-50 text-red-700"
                      : remaining <= 3
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700";
                  return (
                    <li
                      key={arrangement.id}
                      data-testid={`active-arrangement-${arrangement.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0D162B]">
                          {arrangement.petName}
                        </p>
                        <p className="truncate text-xs text-[#667085]">
                          with {arrangement.ownerName} · ends{" "}
                          {formatDate(arrangement.endDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          data-testid={`days-remaining-${arrangement.id}`}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass}`}
                        >
                          {remaining === 0
                            ? "Ends today"
                            : `${remaining} day${remaining === 1 ? "" : "s"} left`}
                        </span>
                        <Link
                          to={`/custody/${arrangement.id}/timeline`}
                          aria-label={`View timeline for ${arrangement.petName}`}
                          className="text-[13px] font-semibold text-[#E84D2A] transition-colors hover:underline"
                        >
                          Timeline
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </WidgetShell>
          </div>

          {/* Upcoming handovers */}
          <WidgetShell
            testId="upcoming-handovers-widget"
            title="Upcoming handovers"
            meta="Scheduled returns at the end of each arrangement"
            icon={<CalendarDays size={20} aria-hidden="true" />}
            count={upcomingHandovers.length}
          >
            {upcomingHandovers.length === 0 ? (
              <EmptyState
                title="No handovers scheduled"
                description="Handovers appear here as arrangements approach their end date."
              />
            ) : (
              <ul
                role="list"
                aria-label="Upcoming handovers"
                className="flex flex-col divide-y divide-gray-100"
              >
                {upcomingHandovers.map((arrangement) => (
                  <li
                    key={arrangement.id}
                    data-testid={`upcoming-handover-${arrangement.id}`}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0D162B]">
                        {arrangement.petName}
                      </p>
                      <p className="truncate text-xs text-[#667085]">
                        to {arrangement.ownerName} · {arrangement.location}
                      </p>
                    </div>
                    <span className="shrink-0 text-right text-xs font-semibold text-[#0D162B]">
                      {formatDateTime(arrangement.endDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetShell>
        </div>
      </div>

      {/* Approval modal (issue 7) — opened in place, no navigation */}
      {activeRequest ? (
        <ApprovalModal
          request={activeRequest}
          isSubmitting={decisionMutation.isPending}
          errorMessage={decisionError}
          onSubmit={handleDecision}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
