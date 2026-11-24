import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { documentService } from "../../../api/documentService";
import { ApiError } from "../../../lib/api-errors";
import { queryKeys } from "../../../lib/queryKeys";
import type { Document } from "../../../types/documents";

const IN_REVIEW_MESSAGE =
  "This document is attached to an application that is in review and cannot be deleted.";

export function deletionErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return error.message || IN_REVIEW_MESSAGE;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Failed to delete document.";
}

export function isConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}

/**
 * Deletes a document optimistically. A 409 (attached to an in-review
 * application) or any other failure restores the previous list.
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentService.deleteDocument(documentId),
    onMutate: async (documentId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.documents.list() });
      const previous = queryClient.getQueriesData<Document[]>({ queryKey: queryKeys.documents.list() });
      queryClient.setQueriesData<Document[]>({ queryKey: queryKeys.documents.list() }, (current) =>
        Array.isArray(current) ? current.filter((doc) => doc.id !== documentId) : current,
      );
      return { previous };
    },
    onError: (_error, _documentId, context) => {
      context?.previous.forEach(([key, data]: [QueryKey, Document[] | undefined]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.list() });
    },
  });
}
