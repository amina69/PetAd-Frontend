import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { documentService } from "../../../api/documentService";
import { ApiError } from "../../../lib/api-errors";
import { validateUploadFiles } from "../../../lib/documentUploadRules";
import { queryKeys } from "../../../lib/queryKeys";

interface ReplaceDocumentButtonProps {
  documentId: string;
  documentType: string;
}

export function ReplaceDocumentButton({
  documentId,
  documentType,
}: ReplaceDocumentButtonProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    const validationMessage = validateUploadFiles([
      { name: file.name, type: file.type, size: file.size },
    ]);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsReplacing(true);
    setError(null);
    try {
      await documentService.replaceDocument(documentId, { file, type: documentType });
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents.list() });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Failed to replace document.",
      );
    } finally {
      setIsReplacing(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isReplacing}
        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        aria-label={`Replace document ${documentId}`}
      >
        {isReplacing ? "Replacing…" : "Replace"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        data-testid={`replace-input-${documentId}`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void handleFile(file);
        }}
      />
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </span>
  );
}
