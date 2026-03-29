export type DocumentReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DocumentReviewDecision = "APPROVED" | "REJECTED";

export interface AdoptionDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  publicId: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  adoptionId: string;
  createdAt: string;
  updatedAt: string;
  onChainVerified: boolean | null;
  anchorTxHash: string | null;
  reviewStatus: DocumentReviewStatus;
  reviewReason: string | null;
}

export interface ReviewDocumentPayload {
  decision: DocumentReviewDecision;
  reason?: string;
}