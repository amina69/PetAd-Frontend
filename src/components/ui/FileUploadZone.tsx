import { useCallback, useId, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileUploadZoneProps {
  /** Restrict accepted file types, e.g. ".pdf,.jpg,.png" */
  accept?: string;
  /** Maximum number of files allowed (default: 5) */
  maxFiles?: number;
  /** Called with the current list of valid accepted files on every change */
  onFilesChange: (files: File[]) => void;
  /** Optional label rendered above the zone */
  label?: string;
}

interface FileEntry {
  id: string;
  file: File;
  error: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ACCEPT = ".pdf,.jpg,.jpeg,.png";
const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_EXT = /\.(pdf|jpg|jpeg|png)$/i;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Validates a file against the accepted MIME types.
 * The `accept` prop restricts the OS picker; this is the secondary client-side guard.
 */
function validateMime(file: File): string | null {
  const ok = ALLOWED_MIME.has(file.type) || ALLOWED_EXT.test(file.name);
  return ok ? null : "Unsupported type — PDF, JPG or PNG only";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FileUploadZone({
  accept = DEFAULT_ACCEPT,
  maxFiles = 5,
  onFilesChange,
  label,
}: FileUploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const validCount = entries.filter((e) => !e.error).length;
  const atMax = validCount >= maxFiles;

  // Publish only valid files to the parent
  const publish = useCallback(
    (next: FileEntry[]) => {
      onFilesChange(next.filter((e) => !e.error).map((e) => e.file));
    },
    [onFilesChange],
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      setLimitError(null);
      setEntries((prev) => {
        const capacity = maxFiles - prev.filter((e) => !e.error).length;

        if (capacity <= 0) {
          setLimitError(`Maximum ${maxFiles} files allowed`);
          return prev;
        }

        let slots = capacity;
        const next = [...prev];
        let overLimit = false;

        for (const file of incoming) {
          const mimeError = validateMime(file);
          if (mimeError) {
            next.push({ id: uid(), file, error: mimeError });
            continue;
          }
          if (slots <= 0) {
            overLimit = true;
            continue;
          }
          next.push({ id: uid(), file, error: null });
          slots--;
        }

        if (overLimit) {
          setLimitError(`Maximum ${maxFiles} files allowed`);
        }

        publish(next);
        return next;
      });
    },
    [maxFiles, publish],
  );

  const removeEntry = useCallback(
    (id: string) => {
      setLimitError(null);
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        publish(next);
        return next;
      });
    },
    [publish],
  );

  // ─── Event handlers ──────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!atMax) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const openBrowser = () => {
    if (!atMax) inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openBrowser();
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[13px] font-medium text-gray-700">{label}</label>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={atMax ? -1 : 0}
        aria-disabled={atMax}
        aria-label="Upload files. Drag and drop or click to browse"
        data-testid="file-upload-zone"
        data-dragging={dragging || undefined}
        onClick={openBrowser}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        className={cx(
          "flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed px-6 py-10 text-center outline-none",
          "transition-[border-color,background-color] duration-150",
          dragging
            ? "border-orange-400 bg-orange-50/40 cursor-copy"
            : atMax
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : "border-gray-200 bg-white cursor-pointer hover:border-gray-300",
          // focus-visible ring for keyboard users
          "focus-visible:ring-2 focus-visible:ring-[#E84D2A]/40",
        )}
      >
        {/* Upload icon */}
        <svg
          aria-hidden="true"
          className="w-10 h-10 mb-3 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
          />
        </svg>

        <p className="text-sm text-gray-700">
          <span className="font-semibold text-[#E84D2A]">Click to upload</span>
          {" or drag and drop"}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
        data-testid="file-input"
      />

      {/* Limit / global error */}
      {limitError && (
        <p role="alert" className="text-xs text-red-500 mt-0.5" data-testid="limit-error">
          {limitError}
        </p>
      )}

      {/* File list */}
      {entries.length > 0 && (
        <ul className="list-none p-0 mt-2 flex flex-col gap-2" data-testid="file-list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              data-testid="file-entry"
              className={cx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 border",
                entry.error
                  ? "border-red-200 bg-red-50/40"
                  : "border-gray-100 bg-gray-50",
              )}
            >
              {/* File icon */}
              <div
                aria-hidden="true"
                className={cx(
                  "w-7 h-7 rounded flex items-center justify-center shrink-0",
                  entry.error ? "bg-red-100" : "bg-[rgba(232,77,42,0.1)]",
                )}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={entry.error ? "#ef4444" : "#E84D2A"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>

              {/* Name + size / error */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium text-gray-900 m-0 truncate"
                  title={entry.file.name}
                >
                  {entry.file.name}
                </p>
                {entry.error ? (
                  <p role="alert" className="text-[11px] text-red-500 mt-px mb-0">
                    {entry.error}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-px mb-0">
                    {formatBytes(entry.file.size)}
                  </p>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                aria-label={`Remove ${entry.file.name}`}
                onClick={() => removeEntry(entry.id)}
                className="bg-transparent border-none cursor-pointer p-1 text-gray-400 rounded flex items-center justify-center shrink-0 hover:text-gray-700 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* File counter */}
      {entries.length > 0 && (
        <p
          aria-live="polite"
          className="text-xs text-gray-500 text-right mt-1"
          data-testid="file-counter"
        >
          <span className="text-[#E84D2A] font-medium">{validCount}</span>
          {" / "}
          {maxFiles} files
        </p>
      )}
    </div>
  );
}
