import { describe, expect, it } from "vitest";
import {
  DISPUTE_MAX_ATTACHMENTS,
  formatFileSize,
  getUploadRule,
  MAX_UPLOAD_SIZE_MB,
  UPLOAD_RULES,
  validateFile,
  validateFiles,
  validateUpload,
} from "../uploadRules";

const MB = 1024 * 1024;

function file(
  name: string,
  type: string,
  size: number,
  content = "x",
): File {
  const created = new File([size === 0 ? "" : content], name, { type });
  if (created.size !== size) {
    Object.defineProperty(created, "size", { value: size });
  }
  return created;
}

describe("uploadRules", () => {
  it("exposes a 10 MB default limit and a five-file dispute limit", () => {
    expect(MAX_UPLOAD_SIZE_MB).toBe(10);
    expect(DISPUTE_MAX_ATTACHMENTS).toBe(5);
    expect(UPLOAD_RULES["dispute-evidence"].maxSizeMb).toBe(10);
  });

  it.each([
    ["evidence.pdf", "application/pdf"],
    ["photo.jpg", "image/jpeg"],
    ["photo.jpeg", "image/jpeg"],
    ["screenshot.png", "image/png"],
    ["photo.jpg", "image/jpg"],
  ])("accepts %s (%s)", (name, type) => {
    const result = validateUpload(file(name, type, 1024));

    expect(result.ok).toBe(true);
    expect(result.valid).toBe(true);
    if (result.ok) {
      expect(result.file.name).toBe(name);
    }
  });

  it("rejects an unsupported type with a specific message", () => {
    const result = validateFile(
      file("report.exe", "application/x-msdownload", 1024),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("WRONG_TYPE");
      expect(result.message).toBe(
        "report.exe is not allowed. Use PDF, JPG or PNG.",
      );
      expect(result.error.fileName).toBe("report.exe");
    }
  });

  it("catches a renamed .exe → .pdf when the MIME type disagrees", () => {
    const result = validateUpload(
      file("report.pdf", "application/x-msdownload", 1024),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("WRONG_TYPE");
      expect(result.message).toContain("report.pdf is not allowed");
    }
  });

  it("rejects a PDF MIME type hidden behind a disallowed extension", () => {
    const result = validateUpload(
      file("report.exe", "application/pdf", 1024),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("WRONG_TYPE");
    }
  });

  it("rejects zero-byte files", () => {
    const result = validateUpload(file("empty.pdf", "application/pdf", 0));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("EMPTY_FILE");
      expect(result.message).toBe(
        "empty.pdf is empty. Choose a file with content.",
      );
    }
  });

  it("accepts a file exactly at the size limit", () => {
    const result = validateUpload(
      file("limit.pdf", "application/pdf", 10 * MB),
    );

    expect(result.ok).toBe(true);
  });

  it("rejects an oversized file with name, size and limit in the message", () => {
    const result = validateUpload(
      file("huge-evidence.pdf", "application/pdf", 11 * MB),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("TOO_LARGE");
      expect(result.message).toContain("huge-evidence.pdf");
      expect(result.message).toContain("11.0 MB");
      expect(result.message).toContain("10 MB");
    }
  });

  it("supports a per-kind rule override", () => {
    const avatar = getUploadRule("avatar");
    expect(avatar.maxSizeMb).toBe(5);

    const result = validateUpload(
      file("photo.png", "image/png", 6 * MB),
      "avatar",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("TOO_LARGE");
    }
  });

  it("resolves enum-style kind names", () => {
    expect(getUploadRule("DISPUTE_EVIDENCE")).toEqual(
      UPLOAD_RULES["dispute-evidence"],
    );
  });

  it("validates batches without dropping the error details", () => {
    const result = validateFiles([
      file("ok.pdf", "application/pdf", 1024),
      file("bad.exe", "application/x-msdownload", 1024),
      file("empty.png", "image/png", 0),
    ]);

    expect(result.valid).toBe(false);
    expect(result.files.map((entry) => entry.name)).toEqual(["ok.pdf"]);
    expect(result.errors.map((error) => error.code)).toEqual([
      "WRONG_TYPE",
      "EMPTY_FILE",
    ]);
  });

  it("formats file sizes for chips", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2.5 * MB)).toBe("2.5 MB");
  });
});
