import { useMemo, useState } from "react";
import { DocumentUploader } from "../components/forms/DocumentUploader";
import { DocumentList } from "../features/documents/components/DocumentList";
import { useDocuments } from "../features/documents/hooks/useDocuments";
import type { DocumentKind } from "../lib/uploadRules";
import type { Document } from "../types/documents";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";

export default function DocumentsPage() {
  const { data, isLoading, isError, refetch } = useDocuments();
  const [replacing, setReplacing] = useState<Document | null>(null);
  const documents = data ?? [];
  const uploadKind = useMemo<DocumentKind>(() => "ID", []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track verification status. The list refreshes when this window is focused because reviews happen out of band.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          {replacing ? `Replace ${replacing.fileName}` : "Upload documents"}
        </h2>
        <DocumentUploader
          kind={(replacing?.kind as DocumentKind) || uploadKind}
          onUploaded={() => {
            setReplacing(null);
            void refetch();
          }}
        />
      </section>

      {isLoading ? <Skeleton className="h-40 w-full" /> : null}
      {isError ? (
        <EmptyState
          title="Could not load documents"
          description="Verification status will appear after a successful refetch."
          action={{ label: "Try again", onClick: () => void refetch() }}
        />
      ) : null}
      {!isLoading && !isError && documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload the required files to start verification."
        />
      ) : null}
      {!isLoading && documents.length > 0 ? (
        <DocumentList documents={documents} onReplace={setReplacing} />
      ) : null}
    </div>
  );
}
