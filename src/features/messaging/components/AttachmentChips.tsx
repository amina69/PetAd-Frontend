import { useEffect, useMemo } from "react";
import { FileText, X } from "lucide-react";
import { formatBytes, isImageFile } from "../uploadRules";

interface AttachmentChipsProps {
  files: File[];
  onRemove: (index: number) => void;
}

/** Thumbnail chips for files queued in the composer. */
export function AttachmentChips({ files, onRemove }: AttachmentChipsProps) {
  const previews = useMemo(
    () =>
      files.map((file) =>
        isImageFile(file) && typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null,
      ),
    [files],
  );

  useEffect(
    () => () => {
      if (typeof URL.revokeObjectURL === "function") {
        previews.forEach((url) => url && URL.revokeObjectURL(url));
      }
    },
    [previews],
  );

  if (files.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Attachments to send">
      {files.map((file, index) => (
        <li
          key={`${file.name}-${file.size}-${index}`}
          className="flex max-w-[220px] items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-1 pr-2"
        >
          {previews[index] ? (
            <img src={previews[index]!} alt="" className="h-9 w-9 rounded object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded bg-white text-gray-500">
              <FileText size={18} aria-hidden="true" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-gray-900">{file.name}</span>
            <span className="block text-[11px] text-gray-500">{formatBytes(file.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove ${file.name}`}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
