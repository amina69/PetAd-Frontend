import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { raiseDispute, type RaiseDisputePayload } from "../api/disputes";
import type { Dispute } from "../types/dispute";

export interface FileProgress {
  /** 0–100 */
  percent: number;
}

export interface UseMutateRaiseDisputeReturn {
  mutate: (payload: RaiseDisputePayload) => Promise<Dispute>;
  isPending: boolean;
  isUploading: boolean;
  fileProgress: FileProgress[];
  error: string | null;
  reset: () => void;
}

/**
 * useMutateRaiseDispute
 *
 * Wraps POST /disputes with per-file XHR upload progress tracking.
 * On success, invalidates the disputes query cache.
 */
export function useMutateRaiseDispute(): UseMutateRaiseDisputeReturn {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Uploading = pending AND at least one file is in flight (progress < 100)
  const isUploading =
    isPending &&
    fileProgress.length > 0 &&
    fileProgress.some((f) => f.percent < 100);

  const reset = () => {
    setIsPending(false);
    setFileProgress([]);
    setError(null);
  };

  const mutate = async (payload: RaiseDisputePayload): Promise<Dispute> => {
    setError(null);
    setIsPending(true);

    // Initialise per-file progress slots
    const initialProgress: FileProgress[] = (payload.evidence ?? []).map(
      () => ({ percent: 0 }),
    );
    setFileProgress(initialProgress);

    try {
      const result = await raiseDispute(payload, (fileIndex, percent) => {
        setFileProgress((prev) => {
          const next = [...prev];
          if (next[fileIndex]) next[fileIndex] = { percent };
          return next;
        });
      });

      // Mark all files complete
      setFileProgress((prev) => prev.map(() => ({ percent: 100 })));

      // Invalidate disputes list so the new dispute appears
      queryClient.invalidateQueries({ queryKey: ["disputes"] });

      return result;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to raise dispute";
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, isUploading, fileProgress, error, reset };
}
