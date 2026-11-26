import { useState } from "react";
import type { Document } from "../../../types/documents";
import { deletionErrorMessage, useDeleteDocument } from "../hooks/useDeleteDocument";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { ReplaceDocumentButton } from "./ReplaceDocumentButton";

interface DocumentListProps {
  documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
  const deletion = useDeleteDocument();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pending = documents.find((doc) => doc.id === pendingId) ?? null;

  async function confirmDelete() {
    if (!pendingId) return;
    const id = pendingId;
    setPendingId(null);
    try {
      await deletion.mutateAsync(id);
      setMessage(null);
    } catch (error) {
      setMessage(deletionErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {message && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3"
          >
            <span className="text-sm font-medium text-gray-900">{doc.fileName}</span>
            <DocumentStatusBadge status={doc.status} />
            <ReplaceDocumentButton documentId={doc.id} documentType={doc.type} />
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setPendingId(doc.id);
              }}
              aria-label={`Delete ${doc.fileName}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {pending && (
        <div role="dialog" aria-label="Delete document" className="rounded-md border p-3">
          <p>Delete this file?</p>
          <p className="text-sm text-gray-600">
            {pending.fileName} will be removed unless it is attached to an application in review.
          </p>
          <button type="button" onClick={() => void confirmDelete()}>
            Confirm delete
          </button>
          <button type="button" onClick={() => setPendingId(null)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
