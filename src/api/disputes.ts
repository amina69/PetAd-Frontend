import { apiClient } from "../lib/api-client";
import type { Dispute } from "../types/dispute";

export const resolveDispute = async (
  disputeId: string,
  shelterPercent: number,
  adopterPercent: number
) => {
  return apiClient.post(`/disputes/${disputeId}/resolve`, {
    shelterPercent,
    adopterPercent,
  });
};

export interface RaiseDisputePayload {
  adoptionId: string;
  raisedBy: string;
  reason: string;
  description: string;
  evidence?: File[];
}

/**
 * POST /disputes — raises a new dispute with optional evidence files.
 * Sends as JSON when no files are attached, FormData when files are present.
 * The caller is responsible for tracking per-file XHR upload progress.
 */
export const raiseDispute = async (
  payload: RaiseDisputePayload,
  onProgress?: (fileIndex: number, percent: number) => void,
): Promise<Dispute> => {
  const { adoptionId, raisedBy, reason, description, evidence = [] } = payload;

  // ── No files: plain JSON via apiClient ───────────────────────────────────
  if (evidence.length === 0) {
    return apiClient.post<Dispute>("/disputes", {
      adoptionId,
      raisedBy,
      reason,
      description,
    });
  }

  // ── With files: XHR so we get onprogress per file ────────────────────────
  return new Promise<Dispute>((resolve, reject) => {
    const formData = new FormData();
    formData.append("adoptionId", adoptionId);
    formData.append("raisedBy", raisedBy);
    formData.append("reason", reason);
    formData.append("description", description);

    evidence.forEach((file, i) => {
      formData.append(`evidence[${i}]`, file, file.name);
    });

    const xhr = new XMLHttpRequest();

    // Track aggregate progress across all files (simplified: single XHR)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        evidence.forEach((_, i) => onProgress(i, pct));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as Dispute);
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      } else {
        reject(new Error(`Request failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));

    const token =
      localStorage.getItem("auth_token") ??
      sessionStorage.getItem("auth_token");

    const baseURL =
      import.meta.env.VITE_MSW === "true"
        ? "/api"
        : (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api");

    xhr.open("POST", `${baseURL}/disputes`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
};
