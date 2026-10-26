import { useState, type FormEvent } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/emptyState";

/**
 * A single comment on a dispute thread, matching the payload returned by
 * `useDisputeDetail` (`GET /disputes/:id`).
 */
export interface DisputeThreadComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface DisputeThreadProps {
  comments?: DisputeThreadComment[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSubmitComment?: (content: string) => void | Promise<void>;
}

/**
 * Number of skeleton rows rendered while the thread loads.
 *
 * The thread body also reserves a fixed minimum height so the comment composer
 * below never moves between the loading and loaded states (B12 acceptance
 * criterion).
 */
const THREAD_SKELETON_ROWS = 3;

/** Reserved height for the thread body, in pixels. */
const THREAD_MIN_HEIGHT_PX = 320;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ThreadSkeleton() {
  return (
    <div data-testid="dispute-thread-loading" className="space-y-4">
      {Array.from({ length: THREAD_SKELETON_ROWS }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton
            variant="text"
            width={36}
            height={36}
            className="shrink-0 rounded-full"
          />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={12} />
            <Skeleton variant="text" width="90%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      data-testid="dispute-thread-error"
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
        <RefreshCw size={20} aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-900">
          Failed to load the discussion
        </p>
        <p className="text-xs text-gray-500">
          We couldn&apos;t load the comments for this dispute.
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          data-testid="dispute-thread-retry"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * DisputeThread
 *
 * Renders the comment thread for a dispute with distinct loading (skeleton),
 * empty, error (retry) and loaded states.
 *
 * The composer is always mounted, and the body reserves
 * `THREAD_MIN_HEIGHT_PX` so the input does not shift position once the thread
 * has loaded.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/461
 */
export function DisputeThread({
  comments = [],
  isLoading = false,
  isError = false,
  onRetry,
  onSubmitComment,
}: DisputeThreadProps) {
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedDraft = draft.trim();
  const canSubmit = !isError && !isSubmitting && trimmedDraft.length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !onSubmitComment) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitComment(trimmedDraft);
      setDraft("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      data-testid="dispute-thread"
      aria-labelledby="dispute-thread-heading"
      className="bg-white shadow rounded-lg p-6 mt-6"
    >
      <h2
        id="dispute-thread-heading"
        className="text-lg font-semibold text-gray-900 mb-4"
      >
        Discussion
      </h2>

      <div
        data-testid="dispute-thread-body"
        aria-busy={isLoading}
        aria-live="polite"
        style={{ minHeight: THREAD_MIN_HEIGHT_PX }}
      >
        {isLoading ? (
          <ThreadSkeleton />
        ) : isError ? (
          <ThreadErrorState onRetry={onRetry} />
        ) : comments.length === 0 ? (
          <EmptyState
            title="No comments yet"
            description="Start the conversation by adding a comment below."
          />
        ) : (
          <ul data-testid="dispute-comment-list" className="space-y-5">
            {comments.map((comment) => (
              <li
                key={comment.id}
                data-testid={`dispute-comment-${comment.id}`}
                className="flex gap-3"
              >
                <div
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600"
                >
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {comment.authorName}
                    </span>
                    <time
                      dateTime={comment.createdAt}
                      className="text-xs text-gray-400"
                    >
                      {formatTimestamp(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                    {comment.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/*
        The composer lives outside the loading/empty/error branches so it keeps
        a stable position regardless of the thread's fetch state.
      */}
      <form
        data-testid="dispute-comment-form"
        onSubmit={handleSubmit}
        className="mt-4 flex items-start gap-3 border-t border-gray-100 pt-4"
      >
        <label htmlFor="dispute-comment-input" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="dispute-comment-input"
          data-testid="dispute-comment-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment…"
          rows={2}
          disabled={isError}
          className="min-h-[44px] flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
        <button
          type="submit"
          data-testid="dispute-comment-submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={14} aria-hidden="true" />
          Post
        </button>
      </form>
    </section>
  );
}
