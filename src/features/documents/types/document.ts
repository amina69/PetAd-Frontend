export type DocumentStatus = "pending" | "verified" | "rejected";

export interface Document {
  id: string;
  name: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  rejectionReason?: string;
  uploadedAt: string;
  url?: string;
}
