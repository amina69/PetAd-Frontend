import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  documentService,
  type UploadedDocument,
} from "../../api/documentService";
import {
  DISPUTE_MAX_ATTACHMENTS,
  formatFileSize,
  getUploadRule,
  validateUpload,
  type UploadRule,
} from "../../lib/uploadRules";

export type UploadedAttachment = UploadedDocument;
/** Backwards/alternate name used by some upload surfaces. */
export type UploadedFile = UploadedAttachment;

type UploadStatus = "uploading" | "uploaded" | "error" | "cancelled";

interface UploadItem {
  key: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error: string | null;
  attachment?: UploadedAttachment;
}

export interface DocumentUploaderHandle {
  /** Remove an uploaded item by its server id (e.g. from a parent chip). */
  removeUploaded: (attachmentId: string) => void;
}

export interface DocumentUploaderProps {
  /** Document kind used to pick validation rules and the API `type` field. */
  kind?: string;
  /** Explicit accept list; defaults to the MIME types/extensions in the rule. */
  accept?: string;
  /** Overrides the rule's size cap. */
  maxSizeMb?: number;
  /** Maximum number of successfully queued files. Defaults to 5 for evidence. */
  maxFiles?: number;
  /** Called once per file after the API returns its document id. */
  onUploaded?: (attachment: UploadedAttachment) => void;
  /** Called when an already-uploaded file is removed. */
  onRemoved?: (attachmentId: string) => void;
  /** Lets a parent disable submit while files are in flight. */
  onBusyChange?: (isBusy: boolean) => void;
  /** Reports whether any file row currently has a validation/upload error. */
  onValidationErrorChange?: (hasErrors: boolean, messages: string[]) => void;
  /**
   * Set to false when the parent renders its own attachment chips. Error rows
   * and in-flight progress remain visible so nothing is silently dropped.
   */
  showUploadedList?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

function createKey(file: File): string {
  return `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`;
}

function isActive(item: UploadItem): boolean {
  return item.status === "uploading" || item.status === "uploaded";
}

/** Accept the common response shapes so the uploader stays API-shape tolerant. */
function toAttachment(result: unknown, file: File): UploadedAttachment {
  if (typeof result === "string" && result.length > 0) {
    return {
      id: result,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
    };
  }

  if (typeof result === "object" && result !== null) {
    const record = result as Record<string, unknown>;
    const documents = Array.isArray(record.documents)
      ? record.documents[0]
      : undefined;
    const nested =
      (record.document as Record<string, unknown> | undefined) ??
      (documents as Record<string, unknown> | undefined) ??
      record;

    const id = nested.id ?? nested.documentId;
    if (typeof id === "string" && id.length > 0) {
      return {
        id,
        fileName:
          typeof nested.fileName === "string" ? nested.fileName : file.name,
        size: typeof nested.size === "number" ? nested.size : file.size,
        mimeType:
          typeof nested.mimeType === "string" ? nested.mimeType : file.type,
        url:
          typeof nested.fileUrl === "string"
            ? nested.fileUrl
            : typeof nested.url === "string"
              ? nested.url
              : undefined,
      };
    }
  }

  throw new Error("Upload failed: the server did not return a document id.");
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export const DocumentUploader = forwardRef<
  DocumentUploaderHandle,
  DocumentUploaderProps
>(function DocumentUploader(
  {
    kind = "dispute-evidence",
    accept,
    maxSizeMb,
    maxFiles = DISPUTE_MAX_ATTACHMENTS,
    onUploaded,
    onRemoved,
    onBusyChange,
    onValidationErrorChange,
    showUploadedList = true,
    disabled = false,
    className,
    label = "Upload evidence",
    id,
  }: DocumentUploaderProps,
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `document-uploader-${generatedId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<UploadItem[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());

  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const rule = useMemo<UploadRule>(() => {
    const resolved = getUploadRule(kind);
    return maxSizeMb === undefined
      ? resolved
      : { ...resolved, maxSizeMb };
  }, [kind, maxSizeMb]);

  const acceptValue = useMemo(() => {
    if (accept) return accept;
    return [
      ...rule.allowedExtensions,
      ...rule.allowedMimeTypes,
    ].join(",");
  }, [accept, rule]);

  const commit = useCallback(
    (updater: (previous: UploadItem[]) => UploadItem[]) => {
      const next = updater(itemsRef.current);
      itemsRef.current = next;
      setItems(next);
    },
    [],
  );

  const upload = useCallback(
    (key: string, file: File) => {
      const controller = new AbortController();
      controllersRef.current.set(key, controller);

      commit((previous) =>
        previous.map((item) =>
          item.key === key
            ? {
                ...item,
                status: "uploading",
                progress: 0,
                error: null,
              }
            : item,
        ),
      );
      onBusyChange?.(true);

      void documentService
        .uploadDocument({
          file,
          type: kind,
          signal: controller.signal,
          onProgress: (progress) => {
            const rounded = Math.max(0, Math.min(100, Math.round(progress)));
            commit((previous) =>
              previous.map((item) =>
                item.key === key ? { ...item, progress: rounded } : item,
              ),
            );
          },
        })
        .then((result) => {
          if (controller.signal.aborted) return;

          const attachment = toAttachment(result, file);
          commit((previous) =>
            previous.map((item) =>
              item.key === key
                ? {
                    ...item,
                    status: "uploaded",
                    progress: 100,
                    error: null,
                    attachment,
                  }
                : item,
            ),
          );
          setAnnouncement(`${file.name} uploaded.`);
          onBusyChange?.(
            itemsRef.current.some((item) => item.status === "uploading"),
          );
          onUploaded?.(attachment);
        })
        .catch((error: unknown) => {
          const aborted =
            controller.signal.aborted ||
            (error instanceof DOMException && error.name === "AbortError");

          const message = aborted
            ? "Upload cancelled."
            : error instanceof Error
              ? error.message
              : "Upload failed. Please try again.";

          commit((previous) =>
            previous.map((item) =>
              item.key === key
                ? {
                    ...item,
                    status: aborted ? "cancelled" : "error",
                    error: message,
                    progress: aborted ? item.progress : 0,
                  }
                : item,
            ),
          );
          setAnnouncement(`${file.name}: ${message}`);
          onBusyChange?.(
            itemsRef.current.some((item) => item.status === "uploading"),
          );
        })
        .finally(() => {
          controllersRef.current.delete(key);
        });
    },
    [commit, kind, onUploaded, onBusyChange],
  );

  const addFiles = useCallback(
    (incoming: readonly File[]) => {
      if (incoming.length === 0 || disabled) return;

      const activeCount = itemsRef.current.filter(isActive).length;
      const availableSlots = Math.max(0, maxFiles - activeCount);
      const accepted = incoming.slice(0, availableSlots);
      const overLimit = incoming.slice(availableSlots);

      const newItems: UploadItem[] = accepted.map((file) => {
        const result = validateUpload(file, rule);
        return {
          key: createKey(file),
          file,
          status: result.ok ? "uploading" : "error",
          progress: 0,
          error: result.ok ? null : result.message,
        };
      });

      // Over-limit files are shown with a specific message rather than being
      // silently discarded — the same rule the type/size validation follows.
      const fileLabel = maxFiles === 1 ? "file" : "files";
      for (const file of overLimit) {
        newItems.push({
          key: createKey(file),
          file,
          status: "error",
          progress: 0,
          error: `You can attach up to ${maxFiles} ${fileLabel}.`,
        });
      }

      if (newItems.length === 0) return;

      commit((previous) => [...previous, ...newItems]);

      const firstError = newItems.find((item) => item.status === "error");
      setAnnouncement(
        firstError
          ? "A file could not be added. Please review the error below."
          : `${newItems.length} file${newItems.length === 1 ? "" : "s"} selected.`,
      );

      for (const item of newItems) {
        if (item.status !== "error") {
          upload(item.key, item.file);
        }
      }
    },
    [commit, disabled, maxFiles, rule, upload],
  );

  const removeItem = useCallback(
    (key: string) => {
      const item = itemsRef.current.find((entry) => entry.key === key);

      if (item?.status === "uploading") {
        controllersRef.current.get(key)?.abort();
      }

      if (item?.attachment) {
        onRemoved?.(item.attachment.id);
      }

      commit((previous) => previous.filter((entry) => entry.key !== key));
    },
    [commit, onRemoved],
  );

  const cancelItem = useCallback((key: string) => {
    controllersRef.current.get(key)?.abort();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      removeUploaded: (attachmentId: string) => {
        const item = itemsRef.current.find(
          (entry) => entry.attachment?.id === attachmentId,
        );
        if (item) removeItem(item.key);
      },
    }),
    [removeItem],
  );

  const retryItem = useCallback(
    (key: string) => {
      const item = itemsRef.current.find((entry) => entry.key === key);
      if (item) upload(key, item.file);
    },
    [upload],
  );

  const openBrowser = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      addFiles(files);
      event.target.value = "";
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      addFiles(Array.from(event.dataTransfer.files ?? []));
    },
    [addFiles],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openBrowser();
      }
    },
    [openBrowser],
  );

  useEffect(() => {
    const messages = items
      .filter(
        (item) => item.status === "error" || item.status === "cancelled",
      )
      .map((item) => item.error)
      .filter((message): message is string => Boolean(message));

    onValidationErrorChange?.(messages.length > 0, messages);
  }, [items, onValidationErrorChange]);

  useEffect(() => {
    const controllers = controllersRef.current;
    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, []);

  const visibleItems = showUploadedList
    ? items
    : items.filter((item) => item.status !== "uploaded");

  return (
    <div className={cx("flex w-full flex-col gap-3", className)} data-testid="document-uploader">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={`${label}. Drop files here or press Enter to browse.`}
        data-testid="document-dropzone"
        onClick={openBrowser}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center outline-none transition-colors",
          isDragging
            ? "border-[#E84D2A] bg-orange-50/40"
            : "border-gray-200 bg-white hover:border-gray-300",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <svg
          aria-hidden="true"
          className="mb-2 h-8 w-8 text-[#E84D2A]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <span className="text-sm font-medium text-[#E84D2A]">
          Click to upload
        </span>
        <span className="text-sm text-gray-500"> or drag and drop</span>
        <span className="mt-1 text-xs text-gray-400">
          PDF, JPG or PNG · max {rule.maxSizeMb} MB each · up to {maxFiles} files
        </span>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptValue}
          onChange={handleInputChange}
          disabled={disabled}
          aria-label={label}
          className="hidden"
          data-testid="document-uploader-input"
        />
      </div>

      {visibleItems.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {visibleItems.map((item) => (
            <li
              key={item.key}
              data-testid="document-upload-item"
              className="rounded-lg border border-gray-200 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className="m-0 truncate text-[13px] font-medium text-gray-900"
                    title={item.file.name}
                  >
                    {item.file.name}
                  </p>
                  <p className="m-0 text-[11px] text-gray-500">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>

                {item.status === "uploading" && (
                  <button
                    type="button"
                    onClick={() => cancelItem(item.key)}
                    className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    aria-label={`Cancel upload of ${item.file.name}`}
                  >
                    Cancel
                  </button>
                )}

                {(item.status === "error" ||
                  item.status === "cancelled") && (
                  <button
                    type="button"
                    onClick={() => retryItem(item.key)}
                    className="rounded px-2 py-1 text-xs font-medium text-[#E84D2A] hover:bg-orange-50"
                    aria-label={`Retry upload of ${item.file.name}`}
                  >
                    Retry
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {item.error ? (
                <p
                  role="alert"
                  className="m-0 mt-1.5 text-[11px] text-red-600"
                >
                  {item.error}
                </p>
              ) : item.status === "uploading" ? (
                <div
                  role="progressbar"
                  aria-label={`Upload progress for ${item.file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.progress}
                  className="mt-2 h-1 overflow-hidden rounded bg-gray-200"
                >
                  <div
                    className="h-full rounded bg-[#E84D2A] transition-[width] duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              ) : (
                <p className="m-0 mt-1.5 text-[11px] text-green-700">
                  Uploaded
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
});

export default DocumentUploader;
