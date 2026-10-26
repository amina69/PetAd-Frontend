import type { ReactNode } from "react";
import type { Document } from "../../types/documents";

interface DocumentPreviewModalProps {
  document: Document;
  /** Decision controls rendered under the preview. */
  actions?: ReactNode;
}

/**
 * Preview panel for a single document: images render inline, PDFs in a frame,
 * anything else falls back to a download link. File names are rendered as text.
 */
export function DocumentPreviewModal({ document, actions }: DocumentPreviewModalProps) {
  const isImage = document.mimeType.startsWith("image/");
  const isPdf = document.mimeType === "application/pdf";

  return (
    <section
      aria-label={`Preview of ${document.fileName}`}
      className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{document.fileName}</h2>
        <p className="text-xs text-gray-500">
          {document.type} · uploaded {new Date(document.createdAt).toLocaleDateString()}
        </p>
      </header>

      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg bg-gray-50">
        {isImage && (
          <img src={document.fileUrl} alt={document.fileName} className="max-h-[480px]" />
        )}
        {isPdf && (
          <iframe
            src={document.fileUrl}
            title={document.fileName}
            className="h-[480px] w-full"
          />
        )}
        {!isImage && !isPdf && (
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-emerald-700 underline"
          >
            Open {document.fileName}
          </a>
        )}
      </div>

      {actions && <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div>}
    </section>
  );
}
