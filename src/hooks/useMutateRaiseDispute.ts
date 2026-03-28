import { useState } from "react";

export interface DisputePayload {
  targetId: string;
  reason: string;
  files: File[];
}

export function useMutateRaiseDispute() {
  const [progress, setProgress] = useState(0);

  const mutateAsync = (payload: DisputePayload): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/disputes");
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          let errorMsg = "Failed to raise dispute.";
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.message) errorMsg = res.message; // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
          } catch (err) {}
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error occurred during upload."));
      };

      const formData = new FormData();
      formData.append("targetId", payload.targetId);
      formData.append("reason", payload.reason);
      payload.files.forEach((file) => {
        formData.append("evidence", file);
      });

      xhr.send(formData);
    });
  };

  return { mutateAsync, progress, resetProgress: () => setProgress(0) };
}