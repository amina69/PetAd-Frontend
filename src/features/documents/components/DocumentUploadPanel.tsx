import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { documentService } from "../../../api/documentService";
import { ApiError } from "../../../lib/api-errors";
import { validateUploadFiles } from "../../../lib/uploadRules";

export function DocumentUploadPanel() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  function selectFile(next: File | undefined) {
    if (!next) return;
    const validationMessage = validateUploadFiles([
      { name: next.name, type: next.type, size: next.size },
    ]);
    if (validationMessage) {
      setFile(null);
      setError(validationMessage);
      return;
    }
    setFile(next);
    setError(null);
    setCancelled(false);
    setProgress(0);
  }

  async function startUpload(target: File) {
    const controller = new AbortController();
    abortRef.current = controller;
    setIsUploading(true);
    setError(null);
    setCancelled(false);
    setProgress(0);

    try {
      await documentService.uploadDocument({
        file: target,
        type: "Other",
        signal: controller.signal,
        onProgress: (value) => setProgress(Math.round(value)),
      });
      setFile(null);
      setProgress(100);
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "ABORTED") {
        setCancelled(true);
        setError("Upload cancelled. You can retry.");
      } else if (caught instanceof ApiError) {
        setError(caught.message || "Failed to upload document.");
      } else {
        setError("Failed to upload document.");
      }
    } finally {
      setIsUploading(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  function handleRetry() {
    if (file) void startUpload(file);
  }

  return (
    <section aria-label="Upload document" className="flex flex-col gap-3">
      <label htmlFor="document-file" className="text-sm font-medium text-gray-800">
        Upload document
      </label>
      <input
        id="document-file"
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />
      {file && <p className="text-sm text-gray-700">{file.name}</p>}
      {isUploading && (
        <div>
          <p role="status">Uploading {progress}%</p>
          <progress value={progress} max={100} aria-label="Upload progress" />
          <button type="button" onClick={handleCancel}>
            Cancel upload
          </button>
        </div>
      )}
      {!isUploading && (
        <button
          type="button"
          onClick={() => file && void startUpload(file)}
          disabled={!file}
        >
          Upload
        </button>
      )}
      {(error || cancelled) && file && !isUploading && (
        <button type="button" onClick={handleRetry}>
          Retry upload
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
