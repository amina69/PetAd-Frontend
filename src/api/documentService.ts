import { apiClient } from "../lib/api-client";
import { type Document } from "../types/documents";
import { type Document as ManagedDocument } from "../features/documents/types/document";
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

export interface UploadDocumentOptions {
    file: File;
    type: string;
    onProgress?: (progress: number) => void;
}

export const documentService = {
    uploadDocument: (options: UploadDocumentOptions): Promise<void> => {
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

    list: async (): Promise<ManagedDocument[]> => {
        return apiClient.get("/documents");
    },

    upload: (file: File, kind: string, onProgress?: (progress: number) => void): Promise<ManagedDocument> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_URL}/documents`, true);
            xhr.setRequestHeader("Accept", "application/json");
            const token = getToken();
            if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            const report = (value: number) => {
                const clamped = Math.max(0, Math.min(100, value));
                onProgress?.(clamped);
            };
            report(0);

            if (xhr.upload) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && event.total > 0) {
                        report((event.loaded / event.total) * 100);
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    report(100);
                    try {
                        resolve(JSON.parse(xhr.responseText) as ManagedDocument);
                    } catch {
                        reject(new ApiError("Upload response was not valid JSON", { status: xhr.status }));
                    }
                    return;
                }
                reject(new ApiError(`Request failed with status ${xhr.status}`, { status: xhr.status }));
            };

            xhr.onerror = () => {
                reject(new ApiError("Network error - please check your connection", {
                    code: "NETWORK_ERROR",
                    isNetworkError: true,
                }));
            };

            const formData = new FormData();
            formData.append("file", file);
            formData.append("kind", kind);
            xhr.send(formData);
        });
    },

    delete: async (documentId: string): Promise<void> => {
        await apiClient.delete(`/documents/${documentId}`);
    },

    getDownloadUrl: async (documentId: string): Promise<string> => {
        const payload = await apiClient.get<{ url: string }>(`/documents/${documentId}/download-url`);
        return payload.url;
    },

    getDocuments: async (adoptionId?: string, disputeId?: string): Promise<Document[]> => {
        const params = new URLSearchParams();
        if (adoptionId) params.append("adoptionId", adoptionId);
        if (disputeId) params.append("disputeId", disputeId);

        const queryString = params.toString();
        const endpoint = `/documents${queryString ? `?${queryString}` : ""}`;

        return apiClient.get(endpoint);
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
