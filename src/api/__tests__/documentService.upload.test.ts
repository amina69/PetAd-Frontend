import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../lib/api-client";
import { documentService } from "../documentService";

vi.mock("../../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

class MockXHR {
  static last: MockXHR | null = null;
  status = 200;
  responseText = JSON.stringify({
    id: "doc-1",
    name: "shot.png",
    kind: "photo",
    mimeType: "image/png",
    sizeBytes: 12,
    status: "pending",
    uploadedAt: "2026-10-20T00:00:00.000Z",
  });
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: FormData | null = null;

  open() {
    MockXHR.last = this;
  }
  setRequestHeader() {}
  send(body: FormData) {
    this.sent = body;
    this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 } as ProgressEvent);
    this.onload?.();
  }
}

describe("documentService.upload", () => {

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports progress from 0 through 100", async () => {
    vi.stubGlobal("XMLHttpRequest", MockXHR);
    const progress: number[] = [];
    const file = new File(["hello"], "shot.png", { type: "image/png" });

    await documentService.upload(file, "photo", (value) => progress.push(value));

    expect(progress[0]).toBe(0);
    expect(progress).toContain(50);
    expect(progress[progress.length - 1]).toBe(100);
    expect(progress.every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it("lists, deletes, and fetches a fresh download url every time", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ url: "https://files.example/a" })
      .mockResolvedValueOnce({ url: "https://files.example/b" });
    vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined);

    await expect(documentService.list()).resolves.toEqual([]);
    await documentService.delete("doc-1");
    await expect(documentService.getDownloadUrl("doc-1")).resolves.toBe("https://files.example/a");
    await expect(documentService.getDownloadUrl("doc-1")).resolves.toBe("https://files.example/b");

    expect(apiClient.get).toHaveBeenCalledTimes(3);
    expect(apiClient.delete).toHaveBeenCalledWith("/documents/doc-1");
  });
});
