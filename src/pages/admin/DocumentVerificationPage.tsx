import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminOnly } from "../../components/auth/AdminOnly";
import { RejectionReasonModal } from "../../components/modals/RejectionReasonModal";
import { DocumentPreviewModal } from "../../components/ui/DocumentPreviewModal";
import { useVerifyDocument } from "../../hooks/useVerifyDocument";
import { isTypingTarget } from "../../utils/isTypingTarget";

function DocumentVerificationQueue() {
  const { documents, isLoading, isError, refetch, decide, isDeciding } = useVerifyDocument();
  const [index, setIndex] = useState(0);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // After a decision the decided document leaves the queue, so the same index
  // now points at the next one; clamp only when we were on the last item.
  const current = documents[Math.min(index, Math.max(documents.length - 1, 0))];
  const currentIndex = current ? documents.indexOf(current) : 0;

  const verify = async () => {
    if (!current || isDeciding) return;
    try {
      await decide({ documentId: current.id, status: "APPROVED" });
      toast.success("Document verified");
    } catch {
      toast.error("Failed to verify document");
    }
  };

  const reject = async (reason: string) => {
    if (!current) return;
    await decide({ documentId: current.id, status: "REJECTED", reason });
    setIsRejecting(false);
    toast.success("Document rejected");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Shortcuts must never hijack typing, or fire while the reject dialog is open.
      if (isTypingTarget(e.target) || isRejecting) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === "j") setIndex(Math.min(currentIndex + 1, documents.length - 1));
      else if (key === "k") setIndex(Math.max(currentIndex - 1, 0));
      else if (key === "v") void verify();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
            <p className="mt-1 text-sm text-gray-500">
              {documents.length} pending document{documents.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-expanded={showHelp}
              aria-controls="shortcut-help"
              onClick={() => setShowHelp((open) => !open)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
            >
              Keyboard shortcuts
            </button>
            {showHelp && (
              <div
                id="shortcut-help"
                role="region"
                aria-label="Keyboard shortcuts"
                className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg"
              >
                <ul className="space-y-1">
                  <li><kbd>J</kbd> Next document</li>
                  <li><kbd>K</kbd> Previous document</li>
                  <li><kbd>V</kbd> Verify document</li>
                </ul>
                <p className="mt-2 text-xs text-gray-500">
                  Shortcuts are disabled while typing in a field.
                </p>
              </div>
            )}
          </div>
        </div>

        {isLoading && <p role="status">Loading documents…</p>}

        {isError && (
          <div role="alert" className="text-sm text-red-700">
            Could not load the queue.{" "}
            <button type="button" className="underline" onClick={() => void refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && !current && (
          <p className="rounded-xl bg-white p-8 text-center text-gray-600">
            The queue is empty. All documents have been reviewed.
          </p>
        )}

        {current && (
          <>
            <p className="text-sm text-gray-500" aria-live="polite">
              Document {currentIndex + 1} of {documents.length}
            </p>
            <DocumentPreviewModal
              document={current}
              actions={
                <>
                  <button
                    type="button"
                    disabled={isDeciding}
                    onClick={() => void verify()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    disabled={isDeciding}
                    onClick={() => setIsRejecting(true)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              }
            />
          </>
        )}
      </div>

      <RejectionReasonModal
        isOpen={isRejecting}
        onClose={() => setIsRejecting(false)}
        onSubmit={reject}
      />
    </div>
  );
}

export default function DocumentVerificationPage() {
  return (
    <AdminOnly>
      <DocumentVerificationQueue />
    </AdminOnly>
  );
}
