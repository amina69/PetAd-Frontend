import { useCallback, useEffect, useId, useRef, useState } from "react";
import { documentService } from "../../api/documentService";

export interface PreviewDocument {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  document: PreviewDocument | null;
  onClose: () => void;
  getDownloadUrl?: (documentId: string) => Promise<string>;
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isPdf(document: PreviewDocument) {
  return document.mimeType === "application/pdf" || document.name.toLowerCase().endsWith(".pdf");
}

export function DocumentPreviewModal({
  isOpen,
  document,
  onClose,
  getDownloadUrl = documentService.getDownloadUrl,
}: DocumentPreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    setError(null);
    setDownloadError(null);
    retriesRef.current = 0;
    setPreviewUrl(document?.url ?? null);
  }, [isOpen, document]);

  const refreshPreviewUrl = useCallback(async () => {
    if (!document) return;
    if (retriesRef.current >= 1) {
      setError("This preview link expired. Close the preview and try again.");
      return;
    }
    retriesRef.current += 1;
    try {
      const nextUrl = await getDownloadUrl(document.id);
      setPreviewUrl(nextUrl);
      setError(null);
    } catch {
      setError("This preview link expired. Close the preview and try again.");
    }
  }, [document, getDownloadUrl]);

  useEffect(() => {
    if (!isOpen || !document || document.url) return;
    let cancelled = false;
    getDownloadUrl(document.id)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load a preview for this document.");
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, document, getDownloadUrl]);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && window.document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && window.document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") trapFocus(event);
    };
    window.document.addEventListener("keydown", handleKeyDown);
    return () => window.document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, trapFocus]);

  const handleDownload = async () => {
    if (!document) return;
    setDownloadError(null);
    try {
      const url = await getDownloadUrl(document.id);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.name;
      anchor.rel = "noopener";
      anchor.click();
    } catch {
      setDownloadError("Could not download this document. Try again.");
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-3xl rounded-xl bg-white p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {document.name}
          </h2>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close preview">
            Close
          </button>
        </div>

        {error ? <p role="alert">{error}</p> : null}

        {!error && previewUrl && isImage(document.mimeType) ? (
          <img
            src={previewUrl}
            alt={document.name}
            className="max-h-[70vh] w-full object-contain"
            onError={() => {
              void refreshPreviewUrl();
            }}
          />
        ) : null}

        {!error && previewUrl && isPdf(document) ? (
          <object data={previewUrl} type="application/pdf" className="h-[70vh] w-full" aria-label={document.name}>
            <iframe title={document.name} src={previewUrl} className="h-[70vh] w-full" />
            <a href={previewUrl}>Open {document.name}</a>
          </object>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-3">
          {downloadError ? <p role="alert">{downloadError}</p> : null}
          <button type="button" onClick={() => { void handleDownload(); }}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
