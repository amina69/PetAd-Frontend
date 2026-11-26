import { describe, expect, it } from "vitest";
import { acceptAttribute, UPLOAD_RULES, validateFiles } from "../uploadRules";
import { file } from "./testUtils";

describe("uploadRules (message kind)", () => {
  it("accepts images and PDFs", () => {
    const { accepted, errors } = validateFiles("message", [], [
      file("a.png", "image/png"),
      file("b.jpg", "image/jpeg"),
      file("c.pdf", "application/pdf"),
    ]);
    expect(accepted).toHaveLength(3);
    expect(errors).toEqual([]);
  });

  it("rejects wrong types with specific copy naming the file and type", () => {
    const { accepted, errors } = validateFiles("message", [], [
      file("notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ]);
    expect(accepted).toEqual([]);
    expect(errors).toEqual([
      '"notes.docx" is a .docx file. Only images (JPG, PNG, WebP, GIF) and PDFs can be attached.',
    ]);
  });

  it("rejects oversized files with the size and the limit", () => {
    const { errors } = validateFiles("message", [], [file("big.png", "image/png", 7.2 * 1024 * 1024)]);
    expect(errors).toEqual(['"big.png" is 7.2 MB. Each attachment must be 5.0 MB or smaller.']);
  });

  it("rejects empty files", () => {
    expect(validateFiles("message", [], [file("empty.pdf", "application/pdf", 0)]).errors[0]).toMatch(/is empty/);
  });

  it("caps at 3 files per message, counting files already queued", () => {
    const existing = [file("1.png", "image/png"), file("2.png", "image/png")];
    const { accepted, errors } = validateFiles("message", existing, [
      file("3.png", "image/png"),
      file("4.png", "image/png"),
    ]);
    expect(accepted.map((f) => f.name)).toEqual(["3.png"]);
    expect(errors).toEqual(['You can attach up to 3 files per message. "4.png" was not added.']);
  });

  it("falls back to the extension when the browser reports no MIME type", () => {
    expect(validateFiles("message", [], [file("scan.pdf", "")]).accepted).toHaveLength(1);
    expect(validateFiles("message", [], [file("scan.exe", "")]).accepted).toHaveLength(0);
  });

  it("builds an accept attribute from the rule", () => {
    expect(acceptAttribute("message")).toContain("application/pdf");
    expect(acceptAttribute("message")).toContain(".png");
    expect(UPLOAD_RULES.message.maxFiles).toBe(3);
  });
});
