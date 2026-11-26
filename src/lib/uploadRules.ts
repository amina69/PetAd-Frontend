/**
 * Client-side upload validation rules (issue #659).
 *
 * This module is the single source of truth for which files the UI accepts
 * and how large they may be. Client-side validation is a convenience only —
 * the API must still validate every uploaded file.
 */

export type UploadErrorCode = "TOO_LARGE" | "WRONG_TYPE" | "EMPTY_FILE";

export type UploadKind = "dispute-evidence" | "document" | "avatar";

export interface UploadRule {
  /** MIME types accepted for this kind of upload. */
  readonly allowedMimeTypes: readonly string[];
  /** Accepted file extensions (including the leading dot). */
  readonly allowedExtensions: readonly string[];
  /** Maximum file size in megabytes. */
  readonly maxSizeMb: number;
}

/**
 * Central per-kind upload configuration.
 *
 * Dispute evidence follows the product rule used by the existing dispute
 * modal: PDF, JPG or PNG, up to 10 MB per file. The limits are intentionally
 * shared rather than duplicated across every upload surface.
 */
export const UPLOAD_RULES = {
  "dispute-evidence": {
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ],
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMb: 10,
  },
  document: {
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ],
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
    maxSizeMb: 10,
  },
  avatar: {
    allowedMimeTypes: ["image/jpeg", "image/png"],
    allowedExtensions: [".jpg", ".jpeg", ".png"],
    maxSizeMb: 5,
  },
} as const satisfies Record<UploadKind, UploadRule>;

/** Lower-case alias kept for consumers that prefer the shorter name. */
export const uploadRules = UPLOAD_RULES;

/** Default number of files a dispute may attach. */
export const DISPUTE_MAX_ATTACHMENTS = 5;

/** Default size cap (MB) used when no rule is supplied. */
export const MAX_UPLOAD_SIZE_MB = UPLOAD_RULES["dispute-evidence"].maxSizeMb;

export interface UploadValidationError {
  code: UploadErrorCode;
  message: string;
  fileName: string;
}

export type UploadValidationResult =
  | {
      ok: true;
      valid: true;
      file: File;
      rule: UploadRule;
    }
  | {
      ok: false;
      valid: false;
      code: UploadErrorCode;
      message: string;
      error: UploadValidationError;
      rule: UploadRule;
    };

/** Human-readable file size used by upload lists and error messages. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isUploadRule(value: unknown): value is UploadRule {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as UploadRule).allowedMimeTypes) &&
    Array.isArray((value as UploadRule).allowedExtensions)
  );
}

function isPartialUploadRule(
  value: unknown,
): value is Partial<UploadRule> & Pick<UploadRule, "allowedMimeTypes"> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as UploadRule).allowedMimeTypes)
  );
}

function extensionsForMimeTypes(mimeTypes: readonly string[]): string[] {
  const extensions = new Set<string>();
  for (const mimeType of mimeTypes) {
    switch (mimeType) {
      case "application/pdf":
        extensions.add(".pdf");
        break;
      case "image/jpeg":
        extensions.add(".jpg");
        extensions.add(".jpeg");
        break;
      case "image/png":
        extensions.add(".png");
        break;
      case "image/webp":
        extensions.add(".webp");
        break;
      case "image/gif":
        extensions.add(".gif");
        break;
      default:
        break;
    }
  }
  return [...extensions];
}

/**
 * Resolve a rule by kind, accepting both kebab-case and the enum-style names
 * used by the API (e.g. `DISPUTE_EVIDENCE`) without leaking that detail into
 * callers.
 */
export function getUploadRule(
  kindOrRule: string | UploadRule | Partial<UploadRule> = "dispute-evidence",
): UploadRule {
  if (isUploadRule(kindOrRule)) return kindOrRule;

  if (isPartialUploadRule(kindOrRule)) {
    return {
      allowedMimeTypes: kindOrRule.allowedMimeTypes,
      allowedExtensions:
        kindOrRule.allowedExtensions ??
        extensionsForMimeTypes(kindOrRule.allowedMimeTypes),
      maxSizeMb: kindOrRule.maxSizeMb ?? MAX_UPLOAD_SIZE_MB,
    };
  }

  const key =
    typeof kindOrRule === "string"
      ? (kindOrRule
          .trim()
          .toLowerCase()
          .replace(/[_\s]+/g, "-") as UploadKind)
      : "dispute-evidence";

  if (key in UPLOAD_RULES) {
    return UPLOAD_RULES[key];
  }

  if (key.includes("dispute") || key.includes("evidence")) {
    return UPLOAD_RULES["dispute-evidence"];
  }
  if (key.includes("avatar") || key.includes("profile")) {
    return UPLOAD_RULES.avatar;
  }
  return UPLOAD_RULES.document;
}

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return "";
  return fileName.slice(dot).toLowerCase();
}

function normalizeMimeType(mimeType: string): string {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  // Some browsers report the non-standard `image/jpg` for JPEG files.
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

/**
 * Validate a file against a rule.
 *
 * Both the MIME type and the extension must be accepted. This catches a
 * renamed executable (`.exe` → `.pdf`) because its MIME type still disagrees
 * with the claimed extension.
 */
export function validateUpload(
  file: File,
  kindOrRule: string | UploadRule | Partial<UploadRule> = "dispute-evidence",
): UploadValidationResult {
  const rule = getUploadRule(kindOrRule);
  const mimeType = normalizeMimeType(file.type);
  const extension = getFileExtension(file.name);

  const allowedMimeTypes = new Set(rule.allowedMimeTypes);
  const allowedExtensions = new Set(
    rule.allowedExtensions.map((value) => value.toLowerCase()),
  );

  if (file.size === 0) {
    return failure(
      "EMPTY_FILE",
      `${file.name} is empty. Choose a file with content.`,
      file,
      rule,
    );
  }

  const mimeAllowed = mimeType.length > 0 && allowedMimeTypes.has(mimeType);
  const extensionAllowed = extension.length > 0 && allowedExtensions.has(extension);

  if (!mimeAllowed || !extensionAllowed) {
    return failure(
      "WRONG_TYPE",
      `${file.name} is not allowed. Use PDF, JPG or PNG.`,
      file,
      rule,
    );
  }

  const maxBytes = rule.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return failure(
      "TOO_LARGE",
      `${file.name} is too large (${formatFileSize(file.size)}). Maximum size is ${rule.maxSizeMb} MB.`,
      file,
      rule,
    );
  }

  return { ok: true, valid: true, file, rule };
}

/** Alias for callers that prefer the shorter verb. */
export const validateFile = validateUpload;

/** Validate a batch while preserving the order of valid files. */
export function validateFiles(
  files: readonly File[],
  kindOrRule: string | UploadRule | Partial<UploadRule> = "dispute-evidence",
): {
  valid: boolean;
  files: File[];
  errors: UploadValidationError[];
} {
  const accepted: File[] = [];
  const errors: UploadValidationError[] = [];

  for (const file of files) {
    const result = validateUpload(file, kindOrRule);
    if (result.ok) {
      accepted.push(file);
    } else {
      errors.push(result.error);
    }
  }

  return { valid: errors.length === 0, files: accepted, errors };
}

function failure(
  code: UploadErrorCode,
  message: string,
  file: File,
  rule: UploadRule,
): UploadValidationResult {
  return {
    ok: false,
    valid: false,
    code,
    message,
    error: { code, message, fileName: file.name },
    rule,
  };
}
