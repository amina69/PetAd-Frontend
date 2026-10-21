export type DocumentKind =
  | "ID"
  | "VACCINATION"
  | "VET_REPORT"
  | "PROOF_OF_ADDRESS"
  | "OTHER";

export type UploadRuleErrorCode = "TOO_LARGE" | "WRONG_TYPE" | "EMPTY_FILE";

export interface UploadRule {
  kind: DocumentKind;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  maxSizeMb: number;
}

export interface UploadValidationError {
  ok: false;
  code: UploadRuleErrorCode;
  message: string;
}

export type UploadValidationResult = { ok: true } | UploadValidationError;

const IMAGE_AND_PDF_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

const IMAGE_AND_PDF_EXTS = [".pdf", ".jpg", ".jpeg", ".png"] as const;

export const UPLOAD_RULES: Record<DocumentKind, UploadRule> = {
  ID: {
    kind: "ID",
    allowedMimeTypes: IMAGE_AND_PDF_MIMES,
    allowedExtensions: IMAGE_AND_PDF_EXTS,
    maxSizeMb: 10,
  },
  VACCINATION: {
    kind: "VACCINATION",
    allowedMimeTypes: IMAGE_AND_PDF_MIMES,
    allowedExtensions: IMAGE_AND_PDF_EXTS,
    maxSizeMb: 15,
  },
  VET_REPORT: {
    kind: "VET_REPORT",
    allowedMimeTypes: IMAGE_AND_PDF_MIMES,
    allowedExtensions: IMAGE_AND_PDF_EXTS,
    maxSizeMb: 15,
  },
  PROOF_OF_ADDRESS: {
    kind: "PROOF_OF_ADDRESS",
    allowedMimeTypes: IMAGE_AND_PDF_MIMES,
    allowedExtensions: IMAGE_AND_PDF_EXTS,
    maxSizeMb: 8,
  },
  OTHER: {
    kind: "OTHER",
    allowedMimeTypes: IMAGE_AND_PDF_MIMES,
    allowedExtensions: IMAGE_AND_PDF_EXTS,
    maxSizeMb: 10,
  },
};

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot < 0) {
    return "";
  }
  return fileName.slice(lastDot).toLowerCase();
}

function formatAllowed(rule: UploadRule): string {
  const labels = [
    ...new Set(
      rule.allowedExtensions.map((ext) => {
        const raw = ext.replace(".", "").toUpperCase();
        return raw === "JPEG" ? "JPG" : raw;
      }),
    ),
  ];
  if (labels.length === 1) {
    return labels[0];
  }
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

/**
 * Client-side convenience checks only. The API still re-validates.
 * MIME type and extension must both match the kind's allow-list so a
 * renamed `.exe → .pdf` is rejected when the MIME disagrees.
 */
export function validateUpload(file: File, kind: DocumentKind): UploadValidationResult {
  const rule = UPLOAD_RULES[kind] ?? UPLOAD_RULES.OTHER;

  if (file.size === 0) {
    return {
      ok: false,
      code: "EMPTY_FILE",
      message: `${file.name} is empty. Choose a file that is not zero bytes.`,
    };
  }

  const maxBytes = rule.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      code: "TOO_LARGE",
      message: `${file.name} is too large. Maximum size is ${rule.maxSizeMb} MB.`,
    };
  }

  const extension = getExtension(file.name);
  const mimeOk = rule.allowedMimeTypes.includes(file.type);
  const extensionOk = rule.allowedExtensions.includes(extension);

  if (!mimeOk || !extensionOk) {
    return {
      ok: false,
      code: "WRONG_TYPE",
      message: `${file.name} is not allowed. Use ${formatAllowed(rule)}.`,
    };
  }

  return { ok: true };
}

export function acceptAttributeFor(kind: DocumentKind): string {
  const rule = UPLOAD_RULES[kind] ?? UPLOAD_RULES.OTHER;
  return [...rule.allowedMimeTypes, ...rule.allowedExtensions].join(",");
}
