import React, { useCallback, useId, useRef, useState } from "react";

export interface EvidenceFile {
  id: string;
  file: File;
  progress: number;
  error: string | null;
}

export interface EvidenceUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_EXT = /\.(pdf|jpg|jpeg|png)$/i;

function validate(file: File): string | null {
  const typeOk = ALLOWED_TYPES.has(file.type) || ALLOWED_EXT.test(file.name);
  if (!typeOk) return "Unsupported type — PDF, JPG or PNG only";
  if (file.size > MAX_SIZE) return "File too large — max 10 MB";
  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Tiny helper — joins truthy class strings, avoids needing clsx. */
function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function EvidenceUpload({
  onFilesChange,
  maxFiles = 5,
}: EvidenceUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<EvidenceFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const validCount = items.filter((i) => !i.error).length;
  const atMax = validCount >= maxFiles;

  const publish = useCallback(
    (next: EvidenceFile[]) => {
      onFilesChange(next.filter((i) => !i.error).map((i) => i.file));
    },
    [onFilesChange],
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      setItems((prev) => {
        const capacity = maxFiles - prev.filter((i) => !i.error).length;
        let slots = capacity;
        const next = [...prev];

        for (const file of incoming) {
          const error = validate(file);
          if (!error && slots <= 0) continue;
          next.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            progress: 0,
            error,
          });
          if (!error) slots--;
        }
        publish(next);
        return next;
      });
    },
    [maxFiles, publish],
  );

  const removeFile = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        publish(next);
        return next;
      });
    },
    [publish],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!atMax) addFiles(Array.from(e.dataTransfer.files));
    },
    [atMax, addFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(Array.from(e.target.files));
      e.target.value = "";
    },
    [addFiles],
  );

  const openBrowser = useCallback(() => {
    if (!atMax) inputRef.current?.click();
  }, [atMax]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !atMax) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [atMax],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={atMax ? -1 : 0}
        aria-disabled={atMax}
        aria-label={`Drop files here or press Enter to browse. Accepts PDF, JPG and PNG up to 10 MB each. ${validCount} of ${maxFiles} files added.`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!atMax) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={openBrowser}
        onKeyDown={handleKeyDown}
        className={cx(
          // Layout & spacing
          "rounded-lg py-8 px-4 text-center outline-none",
          // Border — 1.5 px dashed, colour changes on drag
          "border border-dashed",
          dragging
            ? "border-[#E84D2A] bg-[rgba(232,77,42,0.04)]"
            : "border-[#757778] bg-transparent",
          // Disabled-when-full state
          atMax ? "cursor-not-allowed opacity-50" : "cursor-pointer opacity-100",
          // Smooth transition for border colour and background
          "transition-[border-color,background-color] duration-150",
        )}
      >
        {/* Upload icon */}
        <svg
          aria-hidden="true"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E84D2A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-3 block"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <p className="text-sm font-medium text-black mb-1">
          Drop files here
        </p>

        <p className="text-xs text-[#757778] m-0">
          or{" "}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              openBrowser();
            }}
            className={cx(
              "text-[#E84D2A] bg-transparent border-none text-xs underline p-0",
              atMax ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            click to browse
          </button>
        </p>

        <p className="text-xs text-[#757778] mt-1.5">
          PDF, JPG, PNG · max 10 MB per file
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {items.length > 0 && (
        <ul className="list-none p-0 mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={cx(
                "rounded-lg px-3 py-2.5 border-[0.5px] border-[#E9ECEF]",
                // item.error
                //   ? "bg-[#FFFAFA] border-[#C53434]"
                //   : "bg-[#FFF2E5] border-[#E9ECEF]",
              )}
              style={{ borderWidth: "0.5px" }}
            >
              {/* File row */}
              <div className="flex items-center gap-2.5">
                {/* File icon */}
                <div
                  className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-[rgba(232,77,42,0.1)]"
                  aria-hidden="true"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#E84D2A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>

                {/* Name + size */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13px] font-medium text-black m-0 truncate"
                    title={item.file.name}
                  >
                    {item.file.name}
                  </p>
                  <p className="text-[11px] text-[#757778] mt-px mb-0">
                    {formatSize(item.file.size)}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => removeFile(item.id)}
                  className="bg-transparent border-none cursor-pointer p-1 text-[#757778] rounded flex items-center justify-center shrink-0 hover:text-black transition-colors"
                >
                  <svg
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

              {/* Progress bar or error */}
              {item.error ? (
                <p
                  role="alert"
                  className="text-[11px] text-red-400 mt-1.5 mb-0 flex items-center gap-1"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {item.error}
                </p>
              ) : (
                <div
                  role="progressbar"
                  aria-valuenow={item.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Upload progress for ${item.file.name}`}
                  className="mt-2 h-[3px] rounded-sm bg-green-200 overflow-hidden"
                >
                  <div
                    className="h-full rounded-sm bg-[#E84D2A] transition-[width] duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <p
          aria-live="polite"
          className="text-xs text-black text-right mt-2"
        >
          <span className="text-[#E84D2A] font-medium">{validCount}</span>
          {" / "}
          {maxFiles} files
        </p>
      )}
    </div>
  );
}