import { useState, useEffect } from 'react';
import { FileText, FileImage, Download, Trash2 } from 'lucide-react';

import type { Document } from '../../types/documents';
import type { UserRole } from '../../types/auth';
import { DocumentIntegrityBadge } from './DocumentIntegrityBadge';
import { DocumentExpiryBadge } from './DocumentExpiryBadge';
import { DocumentReUploadFlow } from './DocumentReUploadFlow';
import { documentService } from '../../api/documentService';

interface DocumentRowProps {
  document: Document;
  currentUserId: string;
  currentUserRole: UserRole;
  onDelete: (id: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb % 1 === 0 ? kb.toFixed(0) : kb.toFixed(1)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
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

export function DocumentRow({
  document,
  currentUserId,
  currentUserRole,
  onDelete,
}: DocumentRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean | null;
    hash: string | null;
  }>({
    verified: document.onChainVerified,
    hash: document.anchorTxHash,
  });

  useEffect(() => {
    // Only verify if not already verified or if explicitly unverified (null means unknown)
    if (document.onChainVerified === null) {
      const verify = async () => {
        setIsVerifying(true);
        try {
          const result = await documentService.verifyDocument(document.id);
          setVerificationResult({
            verified: result.verified,
            hash: result.hash,
          });
        } catch (error) {
          console.error('Failed to verify document:', error);
          setVerificationResult({
            verified: false,
            hash: null,
          });
        } finally {
          setIsVerifying(false);
        }
      };
      verify();
    }
  }, [document.id, document.onChainVerified]);

  const canDelete =
    currentUserRole === 'ADMIN' || document.uploadedById === currentUserId;

  // Check if document is expired or rejected
  const isExpired = document.expiresAt && new Date(document.expiresAt) < new Date();
  const isRejected = verificationResult.verified === false;
  const canReUpload = (isExpired || isRejected) && canDelete;

  const uploadedDate = new Date(document.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  function handleDeleteClick() {
    setConfirmingDelete(true);
  }

  function handleConfirmDelete() {
    onDelete(document.id);
    setConfirmingDelete(false);
  }

  function handleCancelDelete() {
    setConfirmingDelete(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <FileTypeIcon mimeType={document.mimeType} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{document.fileName}</p>
          <p className="text-xs text-gray-500">
            {formatBytes(document.size)} &middot; {uploadedDate}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DocumentIntegrityBadge
          onChainVerified={isVerifying ? null : verificationResult.verified}
          anchorTxHash={verificationResult.hash}
        />
        <DocumentExpiryBadge expiresAt={document.expiresAt} />

        {canReUpload && (
          <DocumentReUploadFlow
            documentId={document.id}
            documentType={document.type}
          />
        )}

        <a
          href={document.fileUrl}
          download={document.fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
          aria-label={`Download ${document.fileName}`}
        >
          <Download className="h-4 w-4" />
          Download
        </a>

        {canDelete && !confirmingDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
            aria-label={`Delete ${document.fileName}`}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}

        {canDelete && confirmingDelete && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700">Delete this file?</span>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
