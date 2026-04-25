import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { documentService } from '../../api/documentService';
import { DocumentUploadModal } from '../modals/DocumentUploadModal';
import { ApiError, ValidationApiError } from '../../lib/api-errors';

interface DocumentReUploadFlowProps {
  documentId: string;
  documentType: string;
  usedQuotaMB?: number;
  totalQuotaMB?: number;
}

export function DocumentReUploadFlow({
  documentId,
  documentType,
  usedQuotaMB = 32,
  totalQuotaMB = 50,
}: DocumentReUploadFlowProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReUpload = async (file: File, type: string) => {
    try {
      await documentService.replaceDocument(documentId, {
        file,
        type,
      });

      // Invalidate documents list
      await queryClient.invalidateQueries({ queryKey: ['documents'] });

      // Show success toast
      toast.success('Document updated');

      // Close modal
      setIsModalOpen(false);
    } catch (error) {
      if (error instanceof ValidationApiError) {
        toast.error('File rejected by security scanner.');
      } else if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to update document.');
      } else {
        toast.error('An unexpected error occurred during upload.');
      }
      throw error; // Re-throw to let the modal handle it
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
        aria-label="Re-upload document"
      >
        Re-upload
      </button>

      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        usedQuotaMB={usedQuotaMB}
        totalQuotaMB={totalQuotaMB}
        initialDocType={documentType}
        onUpload={handleReUpload}
      />
    </>
  );
}