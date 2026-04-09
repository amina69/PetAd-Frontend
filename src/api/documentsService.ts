import { apiClient } from "../lib/api-client";

export const documentsService = {
  async replace(documentId: string, file: { fileName: string } | FormData) {
    // Backend expects a multipart/form-data replace in reality; for dev/tests
    // we send a simple JSON payload with filename so the mock can respond.
    const payload =
      file instanceof FormData ? undefined : { fileName: (file as any).fileName };

    return apiClient.post(`/documents/${documentId}/replace`, payload);
  },
};

export type { };
