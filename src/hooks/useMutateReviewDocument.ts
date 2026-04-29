import { useApiMutation } from "./useApiMutation";
import { useQueryClient } from "@tanstack/react-query";
import { documentService } from "../api/documentService";

export interface DocumentReviewData {
    status: 'APPROVED' | 'REJECTED';
    reason?: string;
}

/**
 * useMutateReviewDocument
 *
 * Mutation hook for reviewing (approving/rejecting) adoption documents.
 * Invalidates the documents query to refetch after review.
 */
export function useMutateReviewDocument(adoptionId: string) {
    const queryClient = useQueryClient();

    const reviewDocument = async (data: {
        documentId: string;
        status: 'APPROVED' | 'REJECTED';
        reason?: string;
    }) => {
        return documentService.reviewDocument(data.documentId, {
            status: data.status,
            reason: data.reason,
        });
    };

    const { mutate, mutateAsync, isPending, isError, error } = useApiMutation(
        reviewDocument,
        {
            invalidates: [['documents', adoptionId]],
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['documents', adoptionId] });
            },
        },
    );

    return {
        reviewDocument: mutate,
        reviewDocumentAsync: mutateAsync,
        isPending,
        isError,
        error,
    };
}