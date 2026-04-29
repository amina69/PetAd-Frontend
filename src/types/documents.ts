import type { UserRole } from './auth';

export interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  adoptionId: string;
  createdAt: string;
  onChainVerified: boolean | null;
  anchorTxHash: string | null;
  expiresAt: string | null;
  type: string;
  // Admin review fields
  adminReviewStatus?: 'APPROVED' | 'REJECTED' | null;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export type { UserRole };
