import { useId, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { documentService } from "../../api/documentService";
import {
  acceptAttributeFor,
  type DocumentKind,
  UPLOAD_RULES,
  validateUpload,
} from "../../lib/uploadRules";

export interface DocumentUploaderProps {
  kind: DocumentKind;
  accept?: string;
  maxSizeMb?: number;
  maxFiles?: number;
  onUploaded?: (files: File[]) => void;
  uploadFile?: (file: File, context: { signal: AbortSignal; onProgress: (percent: number) => void }) => Promise<void>;
}

type FileUploadState = {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "error" | "cancelled";
  error?: string;
  controller: AbortController;
};

function defaultUpload(file: File, kind: DocumentKind, context: { signal: AbortSignal; onProgress: (percent: number) => void }) {
  return documentService.uploadDocument({
    file,
    type: kind,
    signal: context.signal,
    onProgress: context.onProgress,
  });
}

export function DocumentUploader({
  kind,
  accept,
  maxSizeMb,
  maxFiles = 5,
  onUploaded,
  uploadFile,
}: DocumentUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [announcement, setAnnouncement] = useState("Ready to upload documents.");
  const rule = UPLOAD_RULES[kind] ?? UPLOAD_RULES.OTHER;
  const resolvedMaxMb = maxSizeMb ?? rule.maxSizeMb;
  const resolvedAccept = accept ?? acceptAttributeFor(kind);

  const announce = (message: string) => setAnnouncement(message);

  const startUpload = (entry: FileUploadState) => {
    const run = uploadFile ?? ((file, context) => defaultUpload(file, kind, context));

    setItems((current) =>
      current.map((item) =>
        item.id === entry.id ? { ...item, status: "uploading", progress: 0, error: undefined } : item,
      ),
    );
    announce(`Uploading ${entry.file.name}`);

    run(entry.file, {
      signal: entry.controller.signal,
      onProgress: (percent) => {
        setItems((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, progress: Math.max(0, Math.min(100, percent)) } : item,
          ),
        );
      },
    })
      .then(() => {
        setItems((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, status: "done", progress: 100 } : item,
          ),
        );
        announce(`${entry.file.name} uploaded`);
        onUploaded?.([entry.file]);
      })
      .catch((error: unknown) => {
        if (entry.controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          setItems((current) =>
            current.map((item) =>
              item.id === entry.id ? { ...item, status: "cancelled", error: "Cancelled" } : item,
            ),
          );
          announce(`${entry.file.name} cancelled`);
          return;
        }

        const message = error instanceof Error ? error.message : "Upload failed";
        setItems((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, status: "error", error: message } : item,
          ),
        );
        announce(`${entry.file.name} failed: ${message}`);
      });
  };

  const addFiles = (incoming: File[]) => {
    const remaining = Math.max(0, maxFiles - items.filter((item) => item.status !== "cancelled").length);
    const selected = incoming.slice(0, remaining);
    const next: FileUploadState[] = [];

    for (const file of selected) {
      const sized = resolvedMaxMb !== rule.maxSizeMb
        ? new File([file], file.name, { type: file.type })
        : file;
      const result = validateUpload(file, kind);
      if (result.ok && file.size > resolvedMaxMb * 1024 * 1024) {
        announce(`${file.name} is too large. Maximum size is ${resolvedMaxMb} MB.`);
        next.push({
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          file,
          progress: 0,
          status: "error",
          error: `${file.name} is too large. Maximum size is ${resolvedMaxMb} MB.`,
          controller: new AbortController(),
        });
        continue;
      }
      if (!result.ok) {
        announce(result.message);
        next.push({
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          file,
          progress: 0,
          status: "error",
          error: result.message,
          controller: new AbortController(),
        });
        continue;
      }

      const entry: FileUploadState = {
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file: sized,
        progress: 0,
        status: "queued",
        controller: new AbortController(),
      };
      next.push(entry);
    }

    if (next.length === 0) {
      return;
    }

    setItems((current) => [...current, ...next]);
    next.filter((item) => item.status === "queued").forEach(startUpload);
  };

  const handleBrowse = () => inputRef.current?.click();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    addFiles(files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    addFiles(Array.from(event.dataTransfer.files || []));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleBrowse();
    }
  };

  const cancelUpload = (id: string) => {
    const match = items.find((item) => item.id === id);
    match?.controller.abort();
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "cancelled", error: "Cancelled" } : item,
      ),
    );
    if (match) {
      announce(`${match.file.name} cancelled`);
    }
  };

  const retryUpload = (id: string) => {
    const match = items.find((item) => item.id === id);
    if (!match) {
      return;
    }
    const retryEntry: FileUploadState = {
      ...match,
      controller: new AbortController(),
      status: "queued",
      progress: 0,
      error: undefined,
    };
    setItems((current) => current.map((item) => (item.id === id ? retryEntry : item)));
    startUpload(retryEntry);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload documents. Drag and drop or press Enter to browse"
        onClick={handleBrowse}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#E84D2A] ${
          isDragOver ? "border-[#0D162B] bg-gray-50" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <p className="text-sm font-medium text-[#E84D2A]">Click to upload</p>
        <p className="text-sm text-gray-500">or drag and drop</p>
        <p className="mt-1 text-xs text-gray-400">Up to {maxFiles} files, {resolvedMaxMb} MB each</p>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={resolvedAccept}
          multiple={maxFiles > 1}
          onChange={handleChange}
          className="sr-only"
          data-testid="document-uploader-input"
        />
      </div>

      <ul className="flex flex-col gap-2" aria-label="Upload progress">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-gray-900">{item.file.name}</p>
              {item.status === "uploading" || item.status === "queued" ? (
                <button
                  type="button"
                  onClick={() => cancelUpload(item.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Cancel
                </button>
              ) : null}
              {item.status === "error" || item.status === "cancelled" ? (
                <button
                  type="button"
                  onClick={() => retryUpload(item.id)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Retry
                </button>
              ) : null}
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(item.progress)}
              aria-label={`${item.file.name} progress`}
            >
              <div className="h-full bg-[#E84D2A]" style={{ width: `${item.progress}%` }} />
            </div>
            {item.error ? <p className="mt-1 text-xs text-red-600">{item.error}</p> : null}
          </li>
        ))}
      </ul>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
