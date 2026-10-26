import { apiClient } from "../lib/api-client";
import { type Document } from "../types/documents";
import { ApiError, ValidationApiError } from "../lib/api-errors";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function getToken(): string | null {
    if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("auth_token");
        if (localToken) return localToken;

        const sessionToken = sessionStorage.getItem("auth_token");
        if (sessionToken) return sessionToken;
    }
    return null;
}

/**
 * The document record returned by `POST /documents`.
 *
 * The backend may wrap the record (for example `{ document }` or
 * `{ documents: [...] }`); `normaliseUploadedDocument` handles those shapes so
 * callers can rely on a flat `{ id, fileName, size, mimeType }`.
 */
export interface UploadedDocument {
    id: string;
    fileName: string;
    size: number;
    mimeType: string;
    url?: string;
}

export interface UploadDocumentOptions {
    file: File;
    type: string;
    onProgress?: (progress: number) => void;
    signal?: AbortSignal;
}

function parseJsonResponse(text: string): unknown {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function normaliseUploadedDocument(
    payload: unknown,
    file: File,
): UploadedDocument {
    const record = extractDocumentRecord(payload);
    const id =
        typeof record?.id === "string"
            ? record.id
            : typeof record?.documentId === "string"
              ? record.documentId
              : null;

    if (!record || id === null || id.length === 0) {
        throw new ApiError(
            "Upload succeeded but the server did not return a document id.",
            { code: "UPLOAD_RESPONSE_INVALID" },
        );
    }

    return {
        id,
        fileName:
            typeof record.fileName === "string" ? record.fileName : file.name,
        size: typeof record.size === "number" ? record.size : file.size,
        mimeType:
            typeof record.mimeType === "string" ? record.mimeType : file.type,
        url:
            typeof record.fileUrl === "string"
                ? record.fileUrl
                : typeof record.url === "string"
                  ? record.url
                  : undefined,
    };
}

function extractDocumentRecord(
    payload: unknown,
): Record<string, unknown> | null {
    if (Array.isArray(payload)) {
        return extractDocumentRecord(payload[0]);
    }

    if (typeof payload !== "object" || payload === null) return null;

    const record = payload as Record<string, unknown>;

    if (typeof record.id === "string") return record;
    if (typeof record.documentId === "string") return record;

    if (record.document) return extractDocumentRecord(record.document);
    if (record.documents) return extractDocumentRecord(record.documents);
    if (record.data) return extractDocumentRecord(record.data);

    return null;
}

export const documentService = {
    uploadDocument: (options: UploadDocumentOptions): Promise<UploadedDocument> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `${API_URL}/documents`;

            xhr.open("POST", url, true);

            // Set standard headers
            xhr.setRequestHeader("Accept", "application/json");

            const token = getToken();
            if (token) {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }

            // Track progress
            if (options.onProgress && xhr.upload) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        options.onProgress?.(percentComplete);
                    }
                };
            }

            if (options.signal) {
                if (options.signal.aborted) {
                    reject(new DOMException("Upload cancelled", "AbortError"));
                    return;
                }

                options.signal.addEventListener(
                    "abort",
                    () => xhr.abort(),
                    { once: true },
                );
            }

            xhr.onabort = () => {
                reject(new DOMException("Upload cancelled", "AbortError"));
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(
                            normaliseUploadedDocument(
                                parseJsonResponse(xhr.responseText),
                                options.file,
                            ),
                        );
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    let errorData: any;
                    let message = `Request failed with status ${xhr.status}`;
                    try {
                        errorData = JSON.parse(xhr.responseText);
                        if (errorData?.message) message = errorData.message;
                    } catch {
                        // non-json response
                        errorData = xhr.responseText;
                    }

                    if (xhr.status === 422) {
                        const fields = errorData?.fields ?? errorData?.errors ?? {};
                        reject(new ValidationApiError(message, fields, {
                            status: 422,
                            code: errorData?.code,
                            data: errorData,
                        }));
                        return;
                    }

                    reject(new ApiError(message, {
                        status: xhr.status,
                        code: errorData?.code,
                        data: errorData,
                    }));
                }
            };

            xhr.onerror = () => {
                reject(new ApiError("Network error - please check your connection", {
                    code: "NETWORK_ERROR",
                    isNetworkError: true,
                }));
            };

            const formData = new FormData();
            formData.append("file", options.file);
            formData.append("type", options.type);

            xhr.send(formData);
        });
    },

    getDocuments: async (adoptionId?: string, disputeId?: string): Promise<Document[]> => {
        const params = new URLSearchParams();
        if (adoptionId) params.append("adoptionId", adoptionId);
        if (disputeId) params.append("disputeId", disputeId);

        const queryString = params.toString();
        const endpoint = `/documents${queryString ? `?${queryString}` : ""}`;

        return apiClient.get(endpoint);
    },

    /** Documents awaiting an admin decision. GET /documents?status=pending */
    getPendingDocuments: async (): Promise<Document[]> => {
        return apiClient.get("/documents?status=pending");
    },

    verifyDocument: async (documentId: string): Promise<{ verified: boolean, hash: string }> => {
        return apiClient.get(`/documents/${documentId}/verify`);
    },

    replaceDocument: (documentId: string, options: UploadDocumentOptions): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `${API_URL}/documents/${documentId}/replace`;

            xhr.open("POST", url, true);

            // Set standard headers
            xhr.setRequestHeader("Accept", "application/json");

            const token = getToken();
            if (token) {
                xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }

            // Track progress
            if (options.onProgress && xhr.upload) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        options.onProgress?.(percentComplete);
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    let errorData: any;
                    let message = `Request failed with status ${xhr.status}`;
                    try {
                        errorData = JSON.parse(xhr.responseText);
                        if (errorData?.message) message = errorData.message;
                    } catch {
                        // non-json response
                        errorData = xhr.responseText;
                    }

                    if (xhr.status === 422) {
                        const fields = errorData?.fields ?? errorData?.errors ?? {};
                        reject(new ValidationApiError(message, fields, {
                            status: 422,
                            code: errorData?.code,
                            data: errorData,
                        }));
                        return;
                    }

                    reject(new ApiError(message, {
                        status: xhr.status,
                        code: errorData?.code,
                        data: errorData,
                    }));
                }
            };

            xhr.onerror = () => {
                reject(new ApiError("Network error - please check your connection", {
                    code: "NETWORK_ERROR",
                    isNetworkError: true,
                }));
            };

            const formData = new FormData();
            formData.append("file", options.file);
            formData.append("type", options.type);

            xhr.send(formData);
        });
    },

    /**
     * Review a document - approve or reject with reason
     * PATCH /documents/:id/review
     */
    reviewDocument: async (
        documentId: string,
        data: { status: 'APPROVED' | 'REJECTED'; reason?: string }
    ): Promise<Document> => {
        return apiClient.patch(`/documents/${documentId}/review`, data);
    }
};
