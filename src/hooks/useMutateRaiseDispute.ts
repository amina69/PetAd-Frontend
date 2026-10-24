import { useApiMutation } from "./useApiMutation";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../lib/api-errors";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export interface RaiseDisputePayload {
  adoptionId: string;
  raisedBy: string;
  reason: string;
  files?: File[];
}

export interface RaiseDisputeOptions {
  onProgress?: (index: number, pct: number) => void;
}

const uploadWithProgress = (
  payload: RaiseDisputePayload,
  onProgress?: (index: number, pct: number) => void,
): Promise<unknown> => {
  // ── JSON path (no files) ──────────────────────────────────────────────
  if (!payload.files?.length) {
    return fetch(`${API_URL}/disputes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        adoptionId: payload.adoptionId,
        raisedBy: payload.raisedBy,
        reason: payload.reason,
      }),
    }).then(async (res) => {
      if (res.ok) return res.json().catch(() => ({}));
      const json = await res.json().catch(() => ({}));
      throw new ApiError(json?.message ?? `Request failed with status ${res.status}`, {
        status: res.status,
      });
    });
  }

  // ── XHR path (with files) ─────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    const files = payload.files!;

    const formData = new FormData();
    formData.append("adoptionId", payload.adoptionId);
    formData.append("raisedBy", payload.raisedBy);
    formData.append("reason", payload.reason);
    files.forEach((file, index) => {
      formData.append("evidence", file);
      onProgress?.(index, 0);
    });

    const xhr = new XMLHttpRequest();

    const authHeader = getAuthHeader();
    if (authHeader.Authorization) {
      xhr.setRequestHeader("Authorization", authHeader.Authorization);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || files.length === 0) return;

      const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
      if (totalSize === 0) return;

      const overallProgress = event.loaded / event.total;
      let accumulatedSize = 0;

      files.forEach((file, i) => {
        const fileSize = file.size || 0;
        const fileStart = accumulatedSize / totalSize;
        const fileEnd = (accumulatedSize + fileSize) / totalSize;

        const pct =
          overallProgress <= fileStart
            ? 0
            : overallProgress >= fileEnd
              ? 100
              : Math.round(
                  ((overallProgress - fileStart) / (fileEnd - fileStart)) * 100,
                );

        onProgress?.(i, pct);
        accumulatedSize += fileSize;
      });
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        let message = `Request failed with status ${xhr.status}`;
        const parsed = tryParseJson(xhr.responseText);
        if (parsed?.message) message = parsed.message;
        reject(new ApiError(message, { status: xhr.status }));
      }
    });

    xhr.addEventListener("error", () =>
      reject(
        new ApiError("Network error - please check your connection", {
          code: "NETWORK_ERROR",
          isNetworkError: true,
        }),
      ),
    );

    xhr.addEventListener("abort", () =>
      reject(new ApiError("Upload was cancelled", { code: "ABORTED" })),
    );

    xhr.open("POST", `${API_URL}/disputes`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(formData);
  });
};

function tryParseJson(text: string): Record<string, string> | null {
  try {
    return JSON.parse(text) as Record<string, string>;
  } catch {
    return null;
  }
}

function getAuthHeader(): { Authorization?: string } {
  try {
    const token =
      localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function useMutateRaiseDispute(options?: RaiseDisputeOptions) {
  const queryClient = useQueryClient();

  return useApiMutation<{ adoptionId: string }, RaiseDisputePayload>(
    (payload) => uploadWithProgress(payload, options?.onProgress) as Promise<{ adoptionId: string }>,
    {
      invalidates: [["disputes"]],
      onSuccess: (_data, variables) => {
        toast.success("Dispute raised successfully");
        queryClient.invalidateQueries({ queryKey: ["adoption", variables.adoptionId] });
      },
      onSettled: (_data, error) => {
        if (error) {
          toast.error(error.message || "Failed to raise dispute");
        }
      }
    }
  );
}
