import { StatusBadge } from "../../../components/ui/StatusBadge";
import { DocumentReUploadFlow } from "../../../components/ui/DocumentReUploadFlow";
import type { Document } from "../../../types/documents";
import { resolveVerificationStatus } from "../hooks/useDocuments";
import { statusConfig, WORKFLOW_DOCUMENT_CHECKLIST } from "../statusConfig";

interface DocumentListProps {
  documents: Document[];
  onReplace?: (document: Document) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb % 1 === 0 ? kb.toFixed(0) : kb.toFixed(1)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

export function DocumentList({ documents, onReplace }: DocumentListProps) {
  const kindsPresent = new Set(documents.map((document) => document.kind ?? document.type));

  return (
    <div className="space-y-6">
      <section aria-label="Required documents checklist">
        <h2 className="text-sm font-semibold text-gray-900">Workflow checklist</h2>
        <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {WORKFLOW_DOCUMENT_CHECKLIST.map((item) => {
            const uploaded = kindsPresent.has(item.kind);
            return (
              <li key={item.kind} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>
                  {item.label}
                  <span className="ml-2 text-xs text-gray-500">
                    {item.required ? "Required" : "Optional"}
                  </span>
                </span>
                <span className={uploaded ? "text-green-700" : "text-amber-700"}>
                  {uploaded ? "Uploaded" : "Missing"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <ul className="space-y-3" aria-label="Document list">
        {documents.map((document) => {
          const status = resolveVerificationStatus(document);
          const config = statusConfig[status];
          const kind = document.kind ?? document.type;
          const uploadedDate = new Date(document.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <li
              key={document.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{document.fileName}</p>
                <p className="text-xs text-gray-500">
                  {kind} · {formatBytes(document.size)} · {uploadedDate}
                </p>
                {status === "REJECTED" && document.rejectionReason ? (
                  <p className="mt-1 text-sm text-red-600" data-testid={`rejection-reason-${document.id}`}>
                    {document.rejectionReason}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge color={config.color} label={config.label} tooltip={config.description} />
                {status === "REJECTED" ? (
                  onReplace ? (
                    <button
                      type="button"
                      onClick={() => onReplace(document)}
                      className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Replace
                    </button>
                  ) : (
                    <DocumentReUploadFlow documentId={document.id} documentType={kind} />
                  )
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
