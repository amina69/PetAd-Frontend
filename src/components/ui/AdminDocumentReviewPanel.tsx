import { useState } from 'react';
import { Check, X, FileText, FileImage } from 'lucide-react';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { useMutateReviewDocument } from '../../hooks/useMutateReviewDocument';
import { DocumentIntegrityBadge } from './DocumentIntegrityBadge';
import { Skeleton } from './Skeleton';
import type { Document } from '../../types/documents';

interface AdminDocumentReviewPanelProps {
  adoptionId: string;
  documents: Document[];
  isLoading?: boolean;
  onDocumentReviewed?: (document: Document) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return <FileText className="h-5 w-5 shrink-0 text-red-500" aria-label="PDF" />;
  }
  if (mimeType.startsWith('image/')) {
    return <FileImage className="h-5 w-5 shrink-0 text-blue-500" aria-label={mimeType.split('/')[1].toUpperCase()} />;
  }
  return <FileText className="h-5 w-5 shrink-0 text-gray-400" aria-label="File" />;
}

interface DocumentReviewItemProps {
  document: Document;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isPending: boolean;
}

function DocumentReviewItem({
  document,
  onApprove,
  onReject,
  isPending,
}: DocumentReviewItemProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason.trim());
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  const isReviewed = document.adminReviewStatus === 'APPROVED' || document.adminReviewStatus === 'REJECTED';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <FileTypeIcon mimeType={document.mimeType} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {document.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {formatBytes(document.size)} &middot; {formatDate(document.createdAt)}
              </p>
            </div>
            
            <DocumentIntegrityBadge
              onChainVerified={document.onChainVerified}
              anchorTxHash={document.anchorTxHash}
            />
          </div>

          {/* Review Status Badge */}
          {isReviewed && (
            <div className="mt-2">
              {document.adminReviewStatus === 'APPROVED' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  <Check className="h-3 w-3" />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                  <X className="h-3 w-3" />
                  Rejected
                  {document.rejectionReason && (
                    <span className="ml-1 text-red-600">- {document.rejectionReason}</span>
                  )}
                </span>
              )}
            </div>
          )}

          {/* Inline Reject Input */}
          {showRejectInput && (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || isPending}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Submitting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectReason('');
                  }}
                  disabled={isPending}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isReviewed && !showRejectInput && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onApprove}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminDocumentReviewPanel({
  adoptionId,
  documents,
  isLoading = false,
  onDocumentReviewed,
}: AdminDocumentReviewPanelProps) {
  const { isAdmin } = useRoleGuard();
  const { reviewDocumentAsync, isPending } = useMutateReviewDocument(adoptionId);

  // Only render for ADMIN role
  if (!isAdmin) {
    return null;
  }

  const approvedCount = documents.filter(
    (doc) => doc.adminReviewStatus === 'APPROVED'
  ).length;
  const totalCount = documents.length;
  const allApproved = totalCount > 0 && approvedCount === totalCount;

  const handleApprove = async (documentId: string) => {
    try {
      await reviewDocumentAsync({ documentId, status: 'APPROVED' });
      onDocumentReviewed?.(
        documents.find((d) => d.id === documentId)!
      );
    } catch (error) {
      console.error('Failed to approve document:', error);
    }
  };

  const handleReject = async (documentId: string, reason: string) => {
    try {
      await reviewDocumentAsync({ documentId, status: 'REJECTED', reason });
      onDocumentReviewed?.(
        documents.find((d) => d.id === documentId)!
      );
    } catch (error) {
      console.error('Failed to reject document:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <Skeleton variant="text" className="mb-4 h-6 w-48" />
        <div className="space-y-3">
          <Skeleton variant="row" />
          <Skeleton variant="row" />
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Document Review
        </h3>
        {totalCount > 0 && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {approvedCount} of {totalCount} documents approved
          </span>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <DocumentReviewItem
            key={doc.id}
            document={doc}
            onApprove={() => handleApprove(doc.id)}
            onReject={(reason) => handleReject(doc.id, reason)}
            isPending={isPending}
          />
        ))}
      </div>

      {/* All Approved Message */}
      {allApproved && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800">
          <Check className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            All documents verified — adoption can proceed to escrow
          </p>
        </div>
      )}

      {/* No documents to review */}
      {totalCount === 0 && (
        <p className="text-sm text-gray-500">No documents to review.</p>
      )}
    </div>
  );
}