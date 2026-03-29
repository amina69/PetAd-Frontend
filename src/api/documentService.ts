import { apiClient } from "../lib/api-client";
import type { AdoptionDocument, ReviewDocumentPayload } from "../types/document";

export const documentService = {
  async getAdoptionDocuments(adoptionId: string): Promise<AdoptionDocument[]> {
    return apiClient.get(`/adoption/${adoptionId}/documents`);
  },

  async reviewDocument(
    documentId: string,
    payload: ReviewDocumentPayload,
  ): Promise<AdoptionDocument> {
    return apiClient.patch(`/documents/${documentId}/review`, payload);
  },
};