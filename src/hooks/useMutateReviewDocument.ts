import { useApiMutation } from "./useApiMutation";
import { documentService } from "../api/documentService";
import type {
  AdoptionDocument,
  DocumentReviewDecision,
} from "../types/document";

interface ReviewDocumentInput {
  documentId: string;
  decision: DocumentReviewDecision;
  reason?: string;
}

export function useMutateReviewDocument(adoptionId: string) {
  const { mutateAsync, isPending, isError, error } = useApiMutation<
    AdoptionDocument,
    ReviewDocumentInput
  >(
    ({ documentId, decision, reason }: ReviewDocumentInput) =>
      documentService.reviewDocument(documentId, { decision, reason }),
    {
      invalidates: [["adoption", adoptionId, "documents"]],
    },
  );

  return {
    mutateReviewDocument: mutateAsync,
    isPending,
    isError,
    error,
  };
}