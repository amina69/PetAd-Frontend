import { describe, expect, it } from "vitest";
import { validateUpload } from "../uploadRules";

function makeFile(name: string, type: string, size: number) {
  const contents = size === 0 ? "" : "x".repeat(size);
  return new File([contents], name, { type });
}

describe("validateUpload", () => {
  it("rejects a zero-byte file", () => {
    const result = validateUpload(makeFile("id.pdf", "application/pdf", 0), "ID");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("EMPTY_FILE");
    }
  });

  it("catches a renamed .exe pretending to be a pdf when MIME disagrees", () => {
    const result = validateUpload(
      makeFile("report.pdf", "application/x-msdownload", 1200),
      "ID",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("WRONG_TYPE");
      expect(result.message).toBe("report.pdf is not allowed. Use PDF, JPG or PNG.");
    }
  });

  it("rejects an actual .exe name even with a pdf MIME", () => {
    const result = validateUpload(
      makeFile("report.exe", "application/pdf", 1200),
      "ID",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("WRONG_TYPE");
      expect(result.message).toBe("report.exe is not allowed. Use PDF, JPG or PNG.");
    }
  });

  it("rejects files over the kind size limit", () => {
    const result = validateUpload(
      makeFile("id.pdf", "application/pdf", 11 * 1024 * 1024),
      "ID",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("TOO_LARGE");
    }
  });

  it("accepts a valid PDF identity document", () => {
    expect(validateUpload(makeFile("passport.pdf", "application/pdf", 2048), "ID")).toEqual({
      ok: true,
    });
  });
});
