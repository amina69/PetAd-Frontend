import { renderDocumentStatus } from "../../../lib/uploadRules";

export function DocumentStatusBadge({ status }: { status?: string | null }) {
  const label = renderDocumentStatus(status);
  return (
    <span
      className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
      data-testid="document-status"
    >
      {label}
    </span>
  );
}
