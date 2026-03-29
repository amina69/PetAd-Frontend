import { useEffect, useMemo, useState } from "react";
import { useRoleGuard } from "../../hooks/useRoleGuard";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useMutateReviewDocument } from "../../hooks/useMutateReviewDocument";
import { documentService } from "../../api/documentService";
import { DocumentIntegrityBadge } from "../ui/DocumentIntegrityBadge";
import type { AdoptionDocument } from "../../types/document";

interface AdminDocumentReviewPanelProps {
  adoptionId: string;
}

const statusClasses: Record<AdoptionDocument["reviewStatus"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export function AdminDocumentReviewPanel({ adoptionId }: AdminDocumentReviewPanelProps) {
  const { isAdmin } = useRoleGuard();
  const { mutateReviewDocument, isPending } = useMutateReviewDocument(adoptionId);
  const [documents, setDocuments] = useState<AdoptionDocument[]>([]);
  const [rejectingDocumentId, setRejectingDocumentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  const { data, isLoading, isError } = useApiQuery<AdoptionDocument[]>(
    ["adoption", adoptionId, "documents"],
    () => documentService.getAdoptionDocuments(adoptionId),
    { enabled: Boolean(adoptionId) },
  );

  useEffect(() => {
    if (data) {
      setDocuments(data);
    }
  }, [data]);

  const approvedCount = useMemo(
    () => documents.filter((doc) => doc.reviewStatus === "APPROVED").length,
    [documents],
  );
  const totalCount = documents.length;
  const allApproved = totalCount > 0 && approvedCount === totalCount;

  if (!isAdmin) {
    return null;
  }

  const updateDocument = (updated: AdoptionDocument) => {
    setDocuments((current) =>
      current.map((doc) => (doc.id === updated.id ? updated : doc)),
    );
  };

  const handleApprove = async (documentId: string) => {
    setActiveDocumentId(documentId);
    try {
      const updated = await mutateReviewDocument({
        documentId,
        decision: "APPROVED",
      });
      updateDocument(updated);
    } finally {
      setActiveDocumentId(null);
    }
  };

  const handleRejectSubmit = async (documentId: string) => {
    const reason = rejectionReason.trim();
    if (!reason) {
      return;
    }

    setActiveDocumentId(documentId);
    try {
      const updated = await mutateReviewDocument({
        documentId,
        decision: "REJECTED",
        reason,
      });
      updateDocument(updated);
      setRejectingDocumentId(null);
      setRejectionReason("");
    } finally {
      setActiveDocumentId(null);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5" aria-label="Document verification panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Document verification</h2>
        <span
          data-testid="review-progress-badge"
          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
        >
          {approvedCount} of {totalCount} documents approved
        </span>
      </div>

      {allApproved ? (
        <p
          data-testid="all-documents-approved-message"
          className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800"
        >
          All documents verified — adoption can proceed to escrow
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-4 text-sm text-gray-500">Loading documents...</p>
      ) : null}

      {isError ? (
        <p className="mt-4 text-sm text-red-700">Failed to load documents. Please refresh and try again.</p>
      ) : null}

      {!isLoading && !isError && documents.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No documents uploaded yet.</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {documents.map((document) => {
          const isRowPending = isPending && activeDocumentId === document.id;
          const isRejecting = rejectingDocumentId === document.id;

          return (
            <article
              key={document.id}
              className="rounded-lg border border-gray-200 p-3"
              data-testid={`document-row-${document.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">{document.fileName}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <DocumentIntegrityBadge
                      onChainVerified={document.onChainVerified}
                      anchorTxHash={document.anchorTxHash}
                    />
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClasses[document.reviewStatus]}`}
                    >
                      {document.reviewStatus}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleApprove(document.id)}
                    disabled={isRowPending || document.reviewStatus === "APPROVED"}
                    className="rounded-md border border-green-600 px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingDocumentId(document.id);
                      setRejectionReason(document.reviewReason ?? "");
                    }}
                    disabled={isRowPending}
                    className="rounded-md border border-red-600 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject with reason
                  </button>
                </div>
              </div>

              {isRejecting ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label htmlFor={`reject-reason-${document.id}`} className="sr-only">
                    Rejection reason
                  </label>
                  <input
                    id={`reject-reason-${document.id}`}
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Enter rejection reason"
                  />
                  <button
                    type="button"
                    onClick={() => void handleRejectSubmit(document.id)}
                    disabled={isRowPending || rejectionReason.trim().length === 0}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit rejection
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingDocumentId(null);
                      setRejectionReason("");
                    }}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}