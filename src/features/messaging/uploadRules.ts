/**
 * Per-kind upload rules. `message` covers chat attachments: images and PDFs
 * only, up to 3 per message. Validation returns specific, user-facing copy.
 */

export type UploadKind = "message";

export interface UploadRule {
  /** Accepted MIME types. */
  mimeTypes: readonly string[];
  /** Extension fallback for browsers that report an empty `file.type`. */
  extensions: readonly string[];
  /** Human list used in error copy. */
  typeLabel: string;
  maxFiles: number;
  maxBytes: number;
}

export const UPLOAD_RULES: Record<UploadKind, UploadRule> = {
  message: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
    extensions: ["jpg", "jpeg", "png", "webp", "gif", "pdf"],
    typeLabel: "images (JPG, PNG, WebP, GIF) and PDFs",
    maxFiles: 3,
    maxBytes: 5 * 1024 * 1024,
  },
};

/** Value for `<input accept>`. */
export function acceptAttribute(kind: UploadKind): string {
  const rule = UPLOAD_RULES[kind];
  return [...rule.mimeTypes, ...rule.extensions.map((ext) => `.${ext}`)].join(",");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isImageFile(file: { type: string; name: string }): boolean {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

export interface FileValidationResult {
  accepted: File[];
  /** One message per rejected file (plus one if the count limit was hit). */
  errors: string[];
}

/**
 * Validates `incoming` files against the rule for `kind`, given files that are
 * already selected. Valid files are accepted until the limit is reached; every
 * rejection explains why.
 */
export function validateFiles(
  kind: UploadKind,
  existing: readonly File[],
  incoming: readonly File[],
): FileValidationResult {
  const rule = UPLOAD_RULES[kind];
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of incoming) {
    const ext = extensionOf(file.name);
    const typeOk = rule.mimeTypes.includes(file.type) || (file.type === "" && rule.extensions.includes(ext));

    if (!typeOk) {
      const what = ext ? `a .${ext} file` : "an unsupported file";
      errors.push(`"${file.name}" is ${what}. Only ${rule.typeLabel} can be attached.`);
      continue;
    }
    if (file.size === 0) {
      errors.push(`"${file.name}" is empty and can't be attached.`);
      continue;
    }
    if (file.size > rule.maxBytes) {
      errors.push(
        `"${file.name}" is ${formatBytes(file.size)}. Each attachment must be ${formatBytes(rule.maxBytes)} or smaller.`,
      );
      continue;
    }
    if (existing.length + accepted.length >= rule.maxFiles) {
      errors.push(
        `You can attach up to ${rule.maxFiles} files per message. "${file.name}" was not added.`,
      );
      continue;
    }
    accepted.push(file);
  }

  return { accepted, errors };
}
