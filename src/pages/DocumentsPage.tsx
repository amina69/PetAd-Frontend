import { useQuery } from "@tanstack/react-query";
import { documentService } from "../api/documentService";
import { DocumentList } from "../features/documents/components/DocumentList";
import { DocumentUploadPanel } from "../features/documents/components/DocumentUploadPanel";

export default function DocumentsPage() {
  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentService.getDocuments(),
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
      <DocumentUploadPanel />
      {documentsQuery.isLoading && <p role="status">Loading documents…</p>}
      {documentsQuery.isError && (
        <p role="alert">Could not load documents. Retry from the upload panel after the list recovers.</p>
      )}
      {documentsQuery.data && <DocumentList documents={documentsQuery.data} />}
    </main>
  );
}
