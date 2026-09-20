import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useDisputeDetail } from "../hooks/useDisputeDetail";
import { EmptyState } from "../components/ui/emptyState";
import { Skeleton } from "../components/ui/Skeleton";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map API uppercase status strings to human-readable badge labels. */
const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-amber-100 text-amber-800" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-blue-100 text-blue-800" },
  RESOLVED: { label: "Resolved", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
  // lowercase variants for cross-type safety
  open: { label: "Open", className: "bg-amber-100 text-amber-800" },
  under_review: { label: "Under Review", className: "bg-blue-100 text-blue-800" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-700" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_LABEL[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Skeleton placeholder for a single comment bubble while thread is loading.
 * Each skeleton has a fixed height matching an average comment card so the
 * comment-input area below stays in a stable position (acceptance criterion).
 */
function CommentSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex gap-3 animate-pulse"
      aria-hidden="true"
      data-testid="comment-skeleton"
    >
      {/* Avatar circle */}
      <div className="shrink-0 h-8 w-8 rounded-full bg-gray-200" />

      <div className="flex-1 space-y-2 py-1">
        {/* Author + timestamp row */}
        <div className="flex items-center gap-3">
          <div
            className="h-3 rounded bg-gray-200"
            style={{ width: index % 2 === 0 ? "25%" : "35%" }}
          />
          <div className="h-3 rounded bg-gray-100 w-16" />
        </div>
        {/* Body lines */}
        <div className="h-3 rounded bg-gray-200 w-full" />
        <div
          className="h-3 rounded bg-gray-200"
          style={{ width: index % 2 === 0 ? "80%" : "65%" }}
        />
      </div>
    </div>
  );
}

/**
 * Rendered comment bubble.
 */
function CommentBubble({ comment }: { comment: Comment }) {
  const initials = comment.authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-3" data-testid="comment-item">
      {/* Avatar */}
      <div
        aria-hidden="true"
        className="shrink-0 h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold"
      >
        {initials}
      </div>

      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {comment.authorName}
          </span>
          <time
            dateTime={comment.createdAt}
            className="text-xs text-gray-400"
          >
            {new Date(comment.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

/**
 * Sticky comment-input form pinned to the bottom of the thread.
 *
 * The outer wrapper always occupies the same vertical space regardless of
 * loading state so the input area never shifts when comments load in.
 */
function CommentInput({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (content: string) => void;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    /*
     * min-h-[96px] reserves vertical space for the input area so the layout
     * stays stable while the thread content above is still loading.
     * This satisfies the acceptance criterion: no layout shift once loaded.
     */
    <div className="min-h-[96px] border-t border-gray-100 bg-white pt-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          disabled={disabled}
          aria-label="Write a comment"
          className="flex-1 resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onKeyDown={(e) => {
            // Submit on Ctrl/Cmd+Enter
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
      <p className="mt-1 text-xs text-gray-400">
        Press <kbd className="font-mono">Ctrl</kbd>+<kbd className="font-mono">Enter</kbd> to submit.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * DisputeThread — shows the full comment thread for a dispute alongside its
 * key metadata.
 *
 * States handled:
 *  - Loading  : Skeleton comment rows. Comment input is visible immediately
 *               (with min-height reserved) so the layout never shifts.
 *  - Empty    : "No messages yet" EmptyState inside the thread body.
 *  - Error    : Inline error banner with a Retry action.
 *  - Data     : Paginated comment list rendered inside a scrollable panel.
 */
export default function DisputeThread() {
  const { id: disputeId } = useParams<{ id: string }>();
  const resolvedId = disputeId ?? "";

  const { data: dispute, isLoading, isError } = useDisputeDetail(resolvedId);

  // Placeholder submit handler — real implementation would call an API mutation
  const handleCommentSubmit = (_content: string) => {
    // TODO: wire up to a useMutateAddComment hook
  };

  const comments: Comment[] = dispute?.comments ?? [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Back navigation ─────────────────────────────────────────── */}
        <Link
          to={resolvedId ? `/disputes/${resolvedId}` : "/disputes"}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Dispute
        </Link>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Dispute Thread</h1>
            {isLoading ? (
              <Skeleton width={80} height={24} />
            ) : dispute ? (
              <StatusPill status={dispute.status} />
            ) : null}
          </div>
          {isLoading ? (
            <Skeleton width="40%" className="mt-2" />
          ) : dispute ? (
            <p className="text-sm text-gray-500">
              Dispute #{resolvedId.slice(0, 8)} &bull;{" "}
              {dispute.reason}
            </p>
          ) : null}
        </div>

        {/* ── Error banner ────────────────────────────────────────────── */}
        {isError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between"
          >
            <p className="text-sm font-medium text-red-800">
              Failed to load dispute thread. Please try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Thread panel ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Thread header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Thread
            </h2>
          </div>

          {/* Comment list
           *
           * IMPORTANT: `min-h-[320px]` is intentionally set on the scrollable
           * body so that the panel occupies a stable height even while loading.
           * This prevents the comment-input area below from shifting downward
           * once real content renders in (acceptance criterion).
           */}
          <div
            className="min-h-[320px] overflow-y-auto px-6 py-5 space-y-6"
            aria-live="polite"
            aria-label="Dispute comments"
          >
            {/* Loading skeletons */}
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <CommentSkeleton key={`comment-skeleton-${i}`} index={i} />
              ))}

            {/* Empty state */}
            {!isLoading && !isError && comments.length === 0 && (
              <div className="flex items-center justify-center h-full py-8">
                <EmptyState
                  title="No messages yet"
                  description="Be the first to add a comment to this dispute thread."
                />
              </div>
            )}

            {/* Rendered comments */}
            {!isLoading &&
              comments.map((comment) => (
                <CommentBubble key={comment.id} comment={comment} />
              ))}
          </div>

          {/* Comment input — always rendered with reserved height to prevent
              layout shift when the thread content above finishes loading.    */}
          <div className="px-6 pb-5">
            <CommentInput
              disabled={isLoading || isError}
              onSubmit={handleCommentSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
