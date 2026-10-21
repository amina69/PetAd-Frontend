import { describe, expect, it } from "vitest";
import {
  UPLOAD_MAX_BYTES,
  formatUploadSize,
  renderDocumentStatus,
  validateUploadFiles,
} from "../uploadRules";

const pdf = (size = 100, name = "record.pdf"): { name: string; type: string; size: number } => ({
  name,
  type: "application/pdf",
  size,
});

describe("validateUploadFiles", () => {
  it("rejects an empty selection", () => {
    expect(validateUploadFiles([])).toBe("Please select a file to upload.");
  });

  it.each([
    ["pdf", "application/pdf", "notes.pdf"],
    ["jpeg", "image/jpeg", "photo.jpg"],
    ["png", "image/png", "scan.png"],
    ["extension fallback", "", "scan.jpeg"],
  ])("accepts %s", (_label, type, name) => {
    expect(validateUploadFiles([{ name, type, size: 20 }])).toBeNull();
  });

  it("rejects an unsupported type", () => {
    expect(
      validateUploadFiles([{ name: "anim.gif", type: "image/gif", size: 20 }]),
    ).toBe("Unsupported file type. PDF, JPG or PNG only.");
  });

  it("rejects more files than maxFiles", () => {
    expect(validateUploadFiles([pdf(), pdf(10, "b.pdf")], { maxFiles: 1 })).toBe(
      "You can upload up to 1 file.",
    );
    expect(
      validateUploadFiles([pdf(), pdf(), pdf(10, "c.pdf")], { maxFiles: 2 }),
    ).toMatch(/up to 2 files/);
  });

  it("rejects the first oversized file and names it", () => {
    const message = validateUploadFiles(
      [pdf(100, "ok.pdf"), pdf(5000, "big.png")],
      { maxFiles: 2, maxFileSize: 1024 },
    );
    expect(message).toContain("big.png");
    expect(message).toContain("maximum is 1.0 KB");
  });

  it("uses a 10 MB default ceiling", () => {
    const message = validateUploadFiles([pdf(UPLOAD_MAX_BYTES + 1, "huge.pdf")]);
    expect(message).toContain("maximum is 10.0 MB");
  });

  it("accepts a file exactly at the limit", () => {
    expect(validateUploadFiles([pdf(1024)], { maxFileSize: 1024 })).toBeNull();
  });
});

describe("formatUploadSize", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatUploadSize(12)).toBe("12 B");
    expect(formatUploadSize(1536)).toBe("1.5 KB");
    expect(formatUploadSize(UPLOAD_MAX_BYTES)).toBe("10.0 MB");
  });
});

describe("renderDocumentStatus", () => {
  it.each([
    ["PENDING", "Pending"],
    ["APPROVED", "Approved"],
    ["REJECTED", "Rejected"],
    ["IN_REVIEW", "In review"],
    [null, "Pending"],
    [undefined, "Pending"],
    ["unknown", "Pending"],
  ])("renders %s as %s", (status, label) => {
    expect(renderDocumentStatus(status)).toBe(label);
  });
});
