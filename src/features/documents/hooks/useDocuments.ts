import { useQuery } from "@tanstack/react-query";
import { documentService } from "../../../api/documentService";
import type { Document } from "../../../types/documents";
import type { DocumentVerificationStatus } from "../statusConfig";

export const documentKeys = {
  all: ["documents"] as const,
  list: (filters: { adoptionId?: string; disputeId?: string }) =>
    ["documents", filters] as const,
};

export function resolveVerificationStatus(document: Document): DocumentVerificationStatus {
  if (document.verificationStatus) {
    return document.verificationStatus;
  }
  if (document.expiresAt && new Date(document.expiresAt) < new Date()) {
    return "EXPIRED";
  }
  if (document.adminReviewStatus === "REJECTED") {
    return "REJECTED";
  }
  if (document.adminReviewStatus === "APPROVED" || document.onChainVerified === true) {
    return "VERIFIED";
  }
  return "PENDING";
}

export function useDocuments(filters: { adoptionId?: string; disputeId?: string } = {}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => documentService.getDocuments(filters.adoptionId, filters.disputeId),
    refetchOnWindowFocus: true,
  });
}
