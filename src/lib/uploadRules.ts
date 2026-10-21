export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = /\.(pdf|jpe?g|png)$/i;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED" | "IN_REVIEW";

export interface UploadCandidate {
  name: string;
  type: string;
  size: number;
}

export interface UploadRuleOptions {
  maxFiles?: number;
  maxFileSize?: number;
}

export function formatUploadSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFile(file: UploadCandidate): boolean {
  return ALLOWED_MIME_TYPES.has(file.type) || ALLOWED_EXTENSIONS.test(file.name);
}

/**
 * Validation matrix for document uploads.
 * Returns a user-facing message, or null when the selection is acceptable.
 */
export function validateUploadFiles(
  files: UploadCandidate[],
  options: UploadRuleOptions = {},
): string | null {
  const maxFiles = options.maxFiles ?? 1;
  const maxFileSize = options.maxFileSize ?? UPLOAD_MAX_BYTES;

  if (files.length === 0) {
    return "Please select a file to upload.";
  }

  if (files.length > maxFiles) {
    return `You can upload up to ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`;
  }

  for (const file of files) {
    if (!isAllowedFile(file)) {
      return "Unsupported file type. PDF, JPG or PNG only.";
    }
    if (file.size > maxFileSize) {
      return `File too large — "${file.name}" is ${formatUploadSize(file.size)}, maximum is ${formatUploadSize(maxFileSize)}.`;
    }
  }

  return null;
}

export function renderDocumentStatus(status: string | null | undefined): string {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "IN_REVIEW":
      return "In review";
    case "PENDING":
    default:
      return "Pending";
  }
}
