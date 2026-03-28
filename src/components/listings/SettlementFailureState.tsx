import { useState } from "react";
import { useRoleGuard } from "../../hooks/useRoleGuard";
import { useApiMutation } from "../../hooks/useApiMutation";
import { escrowService } from "../../api/escrowService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettlementFailureStateProps {
  /** Human-readable reason the settlement failed, returned from the API. */
  failureReason: string;
  /** ID of the escrow to retry. */
  escrowId: string;
  /** Optional callback fired after a successful retry. */
  onRetry?: () => void;
}

type ToastPayload = { message: string; type: "success" | "error" };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Self-dismissing toast notification */
function Toast({ message, type }: ToastPayload) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid={`toast-${type}`}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3
        px-5 py-3.5 rounded-xl shadow-xl text-white text-[14px] font-medium
        ${type === "success" ? "bg-[#22863a]" : "bg-[#E84D2A]"}`}
    >
      {type === "success" ? (
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      {message}
    </div>
  );
}

/** Animated loading spinner */
function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="w-4 h-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/** Confirmation modal shown before retrying settlement */
function RetryConfirmModal({
  isOpen,
  isPending,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={!isPending ? onCancel : undefined}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="retry-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isPending}
          className="absolute top-5 right-5 p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          aria-label="Close confirmation modal"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-8 space-y-6">
          <div>
            <h2
              id="retry-modal-title"
              className="text-[22px] font-bold text-[#0D162B] mb-2"
            >
              Retry Settlement?
            </h2>
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Are you sure you want to retry the escrow settlement? This will
              attempt to process the settlement again.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 py-3 rounded-xl border-2 border-gray-800 text-[14px] font-semibold
                text-gray-800 hover:bg-gray-50 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              data-testid="confirm-retry-btn"
              className="flex-1 py-3 rounded-xl bg-[#E84D2A] text-white text-[14px] font-semibold
                hover:bg-[#d4431f] transition-colors
                disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Spinner />
                  Retrying…
                </>
              ) : (
                "Confirm Retry"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SettlementFailureState
// ---------------------------------------------------------------------------

/**
 * Error state displayed when an escrow settlement has failed.
 *
 * - Shows an error icon and the `failureReason` returned from the API.
 * - "Retry settlement" button is rendered **only** when `useRoleGuard().isAdmin === true`.
 * - Clicking it opens a confirmation modal before the mutation fires.
 * - Shows a spinner on the confirm button while the retry is in progress.
 * - Shows a success toast on retry success, an error toast on retry failure.
 */
export function SettlementFailureState({
  failureReason,
  escrowId,
  onRetry,
}: SettlementFailureStateProps) {
  const { isAdmin } = useRoleGuard();

  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const dispatchToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const { mutate: mutateRetrySettlement, isPending } = useApiMutation<
    void,
    string
  >((id: string) => escrowService.retrySettlement(id), {
    invalidates: [["escrow", escrowId]],
    onSuccess: () => {
      setShowModal(false);
      dispatchToast("Settlement retry succeeded.", "success");
      onRetry?.();
    },
    onSettled: (_data, error) => {
      if (error) {
        setShowModal(false);
        dispatchToast(
          error.message ?? "Settlement retry failed. Please try again.",
          "error",
        );
      }
    },
  });

  const handleConfirm = () => {
    mutateRetrySettlement(escrowId);
  };

  return (
    <>
      <div
        className="flex flex-col items-center justify-center py-10 px-6 text-center"
        role="status"
        aria-label="Settlement failed"
        data-testid="settlement-failure-state"
      >
        {/* Error icon */}
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <svg
            className="w-8 h-8 text-[#E84D2A]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874
                1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h3 className="text-[20px] font-bold text-[#0D162B] mb-2">
          Settlement Failed
        </h3>

        {/* Failure reason from API */}
        <p
          className="text-[14px] text-gray-500 leading-relaxed max-w-[360px] mb-6"
          data-testid="failure-reason"
        >
          {failureReason}
        </p>

        {/* Retry button — admin only */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            disabled={isPending}
            data-testid="retry-settlement-btn"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0D162B] text-white
              text-[14px] font-semibold hover:bg-gray-900 transition-colors
              focus:ring-4 focus:ring-gray-900/20 active:scale-[0.98]
              disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Spinner />
                Retrying…
              </>
            ) : (
              "Retry settlement"
            )}
          </button>
        )}
      </div>

      {/* Confirmation modal */}
      <RetryConfirmModal
        isOpen={showModal}
        isPending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => !isPending && setShowModal(false)}
      />

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
