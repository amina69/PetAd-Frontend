import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { X, AlertTriangle } from "lucide-react";
import { EvidenceUpload } from "../ui/RaiseDisputeModalFileUpload";
import { useMutateRaiseDispute } from "../../hooks/useMutateRaiseDispute";
import type { AdoptionStatus } from "../../types/adoption";
import type { UserRole } from "../../types/auth";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_REASON_LENGTH = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  adoptionId: string;
  /** Current adoption status — modal trigger is only shown for CUSTODY_ACTIVE */
  adoptionStatus: AdoptionStatus;
  /** Logged-in user id */
  userId: string;
  /** Logged-in user role */
  userRole: UserRole;
}

// ─── Trigger button ───────────────────────────────────────────────────────────

/**
 * Renders the "Raise a dispute" button only when:
 *  - adoptionStatus === "CUSTODY_ACTIVE"
 *  - userRole is "USER" (adopter) or "SHELTER"
 */
export function RaiseDisputeTrigger({
  adoptionStatus,
  userRole,
  onClick,
}: {
  adoptionStatus: AdoptionStatus;
  userRole: UserRole;
  onClick: () => void;
}) {
  const canRaise =
    adoptionStatus === "CUSTODY_ACTIVE" &&
    (userRole === "USER" || userRole === "SHELTER");

  if (!canRaise) return null;

  return (
    <button
      type="button"
      data-testid="raise-dispute-trigger"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
    >
      <AlertTriangle className="w-4 h-4" aria-hidden="true" />
      Raise a dispute
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function RaiseDisputeModal({
  isOpen,
  onClose,
  adoptionId,
  adoptionStatus,
  userId,
  userRole,
}: RaiseDisputeModalProps) {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate, isPending, isUploading, fileProgress, error, reset } =
    useMutateRaiseDispute();

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isPending]);

  const descriptionValid = description.trim().length >= MIN_REASON_LENGTH;
  const canSubmit =
    descriptionValid && !isPending && adoptionStatus === "CUSTODY_ACTIVE";

  function handleClose() {
    if (isPending) return;
    setDescription("");
    setFiles([]);
    setTouched(false);
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    try {
      await mutate({
        adoptionId,
        raisedBy: userId,
        reason: description.trim().slice(0, 80), // short reason summary
        description: description.trim(),
        evidence: files,
      });

      toast.success("Dispute raised. Escrow paused.");
      handleClose();
    } catch {
      // error is surfaced via the `error` state from the hook
    }
  }

  if (!isOpen) return null;

  const charsLeft = MIN_REASON_LENGTH - description.trim().length;
  const showLengthError = touched && !descriptionValid;

  // Only adopter (USER) and shelter can raise disputes
  const canRaise =
    adoptionStatus === "CUSTODY_ACTIVE" &&
    (userRole === "USER" || userRole === "SHELTER");

  if (!canRaise) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      data-testid="raise-dispute-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-dispute-title"
        data-testid="raise-dispute-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
            </div>
            <h2
              id="raise-dispute-title"
              className="text-lg font-bold text-gray-900"
            >
              Raise a Dispute
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
          noValidate
        >
          {/* Info banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Raising a dispute will <strong>pause the escrow</strong> until an
            admin reviews and resolves it.
          </div>

          {/* Reason / description */}
          <div className="space-y-1.5">
            <label
              htmlFor="dispute-description"
              className="text-sm font-semibold text-gray-700"
            >
              Reason{" "}
              <span className="font-normal text-gray-400">
                (min {MIN_REASON_LENGTH} characters)
              </span>
            </label>
            <textarea
              ref={textareaRef}
              id="dispute-description"
              data-testid="dispute-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={4}
              placeholder="Describe the issue in detail…"
              disabled={isPending}
              aria-invalid={showLengthError}
              aria-describedby={
                showLengthError ? "description-error" : "description-counter"
              }
              className={[
                "w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none resize-none transition-all",
                "focus:ring-2 focus:ring-[#E84D2A]/20 focus:border-[#E84D2A]",
                showLengthError
                  ? "border-red-400 bg-red-50/30"
                  : "border-gray-200 bg-white",
                isPending ? "opacity-60 cursor-not-allowed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />

            {/* Live counter / error */}
            <div className="flex items-center justify-between">
              {showLengthError ? (
                <p
                  id="description-error"
                  role="alert"
                  className="text-xs text-red-500"
                  data-testid="description-error"
                >
                  {charsLeft > 0
                    ? `${charsLeft} more character${charsLeft !== 1 ? "s" : ""} required`
                    : "Description is required"}
                </p>
              ) : (
                <span />
              )}
              <p
                id="description-counter"
                aria-live="polite"
                data-testid="description-counter"
                className={`text-xs ml-auto ${
                  descriptionValid ? "text-green-600" : "text-gray-400"
                }`}
              >
                {description.trim().length} / {MIN_REASON_LENGTH}+
              </p>
            </div>
          </div>

          {/* Evidence upload */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-gray-700">
              Evidence{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </p>
            <EvidenceUpload
              onFilesChange={setFiles}
              maxFiles={5}
            />

            {/* Per-file upload progress during submission */}
            {isPending && fileProgress.length > 0 && (
              <ul
                className="mt-2 space-y-1.5"
                aria-label="Upload progress"
                data-testid="upload-progress-list"
              >
                {files.map((file, i) => {
                  const pct = fileProgress[i]?.percent ?? 0;
                  return (
                    <li key={file.name} className="space-y-0.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <span>{pct}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Upload progress for ${file.name}`}
                        className="h-1 rounded-full bg-gray-100 overflow-hidden"
                      >
                        <div
                          className="h-full rounded-full bg-[#E84D2A] transition-[width] duration-200"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* API error */}
          {error && (
            <p
              role="alert"
              data-testid="submit-error"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </form>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            data-testid="submit-dispute"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {isUploading ? "Uploading…" : "Submitting…"}
              </span>
            ) : (
              "Submit dispute"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
