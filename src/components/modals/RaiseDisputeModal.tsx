import { useState, useEffect, useCallback } from "react";
import { FileUploadZone } from "../ui/FileUploadZone";
import { useMutateRaiseDispute } from "../../hooks/useMutateRaiseDispute";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  adoptionId: string;
  raisedBy: string;
}

const MIN_LEN = 30;
const MAX_FILES = 5;

export function RaiseDisputeModal({ isOpen, onClose, adoptionId, raisedBy }: Props) {
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<number[]>([]);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleFileProgress = (index: number, pct: number) => {
    setFileProgress((prev) => {
      const next = [...prev];
      next[index] = pct;
      return next;
    });
  };

  const { mutateAsync, isPending, error } = useMutateRaiseDispute({
    onProgress: handleFileProgress,
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    },
    [isPending, onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const updateFiles = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleBackdropClick = () => {
    if (!isPending) onClose();
  };

  const handleSubmit = async () => {
    setInlineError(null);

    if (reason.trim().length < MIN_LEN) {
      setInlineError(`Reason must be at least ${MIN_LEN} characters.`);
      return;
    }

    try {
      await mutateAsync({ adoptionId, raisedBy, reason, files });
      toast.success("Dispute raised. Escrow paused.");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to raise dispute.";
      setInlineError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      onClick={handleBackdropClick}
      data-testid="dispute-backdrop"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {!isPending && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            aria-label="Close modal"
          >
            ✕
          </button>
        )}

        <h2 className="text-lg font-bold mb-2">Raise a dispute</h2>
        <p className="text-sm text-gray-500 mb-4">
          Tell us why you're raising this dispute.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            className="w-full rounded-md border-gray-200 p-3"
            aria-invalid={reason.length > 0 && reason.length < MIN_LEN}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{reason.length < MIN_LEN ? `Minimum ${MIN_LEN} characters` : ""}</span>
            <span>{reason.length} chars</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence
          </label>
          <FileUploadZone
            id="evidence-upload"
            onChange={updateFiles}
            selectedFiles={files}
            maxFiles={MAX_FILES}
          />
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, idx) => (
                <div key={idx}>
                  {typeof fileProgress[idx] === "number" && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="truncate">{file.name}</span>
                        <span className="font-semibold">{fileProgress[idx]}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full">
                        <div
                          className="h-1.5 bg-blue-600 rounded-full"
                          style={{ width: `${fileProgress[idx]}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {inlineError && (
          <div className="mb-3 text-sm text-red-600">{inlineError}</div>
        )}

        {error && (
          <div className="mb-3 text-sm text-red-600">{error.message}</div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-md border"
          >
            Cancel
          </button>
          <button
  onClick={handleSubmit}
  disabled={isPending || reason.trim().length < MIN_LEN}
  className="px-4 py-2 rounded-md bg-slate-900 text-white disabled:opacity-60"
>
  {isPending ? "Submitting..." : "Raise dispute"}
</button>
        </div>
      </div>
    </div>
  );
}