import { useEffect } from "react";
import { X } from "lucide-react";

interface AttachmentPreviewProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/** Full-size image overlay. Esc or the backdrop closes it. */
export function AttachmentPreview({ src, alt, onClose }: AttachmentPreviewProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        autoFocus
        className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-900"
      >
        <X size={20} aria-hidden="true" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
