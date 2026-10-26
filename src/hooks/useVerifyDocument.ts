import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentService } from "../api/documentService";
import { STALE_TIME } from "../lib/staleTime";
import type { Document } from "../types/documents";

export const PENDING_DOCUMENTS_KEY = ["documents", "pending"] as const;

export interface DocumentDecision {
  documentId: string;
  status: "APPROVED" | "REJECTED";
  /** Required for REJECTED; shown to the uploader. */
  reason?: string;
}

/**
 * Admin verification queue: the pending documents plus a `decide` mutation.
 * On success the decided document is removed from the cached queue right away,
 * so the next document slides into the current slot without a refetch wait.
 */
export function useVerifyDocument() {
  const queryClient = useQueryClient();

  const queue = useQuery<Document[]>({
    queryKey: PENDING_DOCUMENTS_KEY,
    queryFn: documentService.getPendingDocuments,
    // Admins review documents out-of-band, so refetch whenever the tab regains focus.
    staleTime: STALE_TIME.DOCUMENTS,
    refetchOnWindowFocus: true,
  });

  const decision = useMutation({
    mutationFn: ({ documentId, status, reason }: DocumentDecision) =>
      documentService.reviewDocument(documentId, { status, reason }),
    onSuccess: (_result, { documentId }) => {
      queryClient.setQueryData<Document[]>(PENDING_DOCUMENTS_KEY, (current) =>
        current?.filter((doc) => doc.id !== documentId),
      );
      void queryClient.invalidateQueries({ queryKey: PENDING_DOCUMENTS_KEY });
    },
  });

  return {
    documents: queue.data ?? [],
    isLoading: queue.isLoading,
    isError: queue.isError,
    refetch: queue.refetch,
    decide: decision.mutateAsync,
    isDeciding: decision.isPending,
  };
}
