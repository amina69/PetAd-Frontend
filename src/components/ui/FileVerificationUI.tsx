import { Plus } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { documentService } from '../../api/documentService';
import { DocumentRow } from './DocumentRow';
import { EmptyState } from './emptyState';
import { Skeleton } from './Skeleton';
import type { UserRole } from '../../types/auth';

interface FileVerificationUIProps {
  adoptionId?: string;
  disputeId?: string;
  currentUserId: string;
  currentUserRole: UserRole;
  isOwner?: boolean;
  onAddDocument?: () => void;
}

export function FileVerificationUI({
  adoptionId,
  disputeId,
  currentUserId,
  currentUserRole,
  isOwner = false,
  onAddDocument,
}: FileVerificationUIProps) {
  const { data: documents, isLoading } = useApiQuery(
    ['documents', adoptionId || disputeId],
    () => documentService.getDocuments(adoptionId, disputeId)
  );

  const canAdd = isOwner || currentUserRole === 'ADMIN';

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="skeleton-loader">
        <Skeleton variant="row" />
        <Skeleton variant="row" />
        <Skeleton variant="row" />
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No documents uploaded yet"
          description="Verification documents will appear here once they are uploaded."
        />
        {canAdd && (
          <div className="flex justify-center">
            <button
              onClick={onAddDocument}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Add document
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Verification Documents</h3>
        {canAdd && (
          <button
            onClick={onAddDocument}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            Add document
          </button>
        )}
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            document={doc}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDelete={(id) => {
              // Implementation for delete would go here
              console.log('Delete document', id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
