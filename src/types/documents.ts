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
}

export type { UserRole };
