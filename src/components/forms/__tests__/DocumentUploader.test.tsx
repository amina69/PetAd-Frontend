import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentUploader } from "../DocumentUploader";
import { documentService } from "../../../api/documentService";

vi.mock("../../../api/documentService", () => ({
  documentService: {
    uploadDocument: vi.fn(),
  },
}));

const uploadMock = vi.mocked(documentService.uploadDocument);

function selectFiles(files: File[]) {
  const input = screen.getByTestId(
    "document-uploader-input",
  ) as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
}

function fileWithSize(name: string, type: string, size: number): File {
  const created = new File(["x"], name, { type });
  Object.defineProperty(created, "size", { value: size });
  return created;
}

describe("DocumentUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadMock.mockResolvedValue({
      id: "doc-1",
      fileName: "evidence.pdf",
      size: 1024,
      mimeType: "application/pdf",
    });
  });

  it("shows a specific error for a wrong-type file and never uploads it", async () => {
    render(<DocumentUploader />);

    selectFiles([
      new File(["hello"], "malware.exe", {
        type: "application/x-msdownload",
      }),
    ]);

    expect(
      await screen.findByText(
        "malware.exe is not allowed. Use PDF, JPG or PNG.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("malware.exe")).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("shows a specific error for an oversized file and never uploads it", async () => {
    render(<DocumentUploader />);

    const oversized = fileWithSize(
      "huge-evidence.pdf",
      "application/pdf",
      11 * 1024 * 1024,
    );
    selectFiles([oversized]);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("huge-evidence.pdf");
    expect(alert).toHaveTextContent("too large");
    expect(alert).toHaveTextContent("10 MB");
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("shows a specific error for an empty file", async () => {
    render(<DocumentUploader />);

    selectFiles([new File([], "empty.pdf", { type: "application/pdf" })]);

    expect(
      await screen.findByText(
        "empty.pdf is empty. Choose a file with content.",
      ),
    ).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("uploads a valid file, reports the returned id and shows name/size", async () => {
    const onUploaded = vi.fn();
    render(<DocumentUploader onUploaded={onUploaded} />);

    selectFiles([new File(["hello"], "evidence.pdf", { type: "application/pdf" })]);

    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalledWith(
        expect.objectContaining({ id: "doc-1", fileName: "evidence.pdf" }),
      );
    });
    expect(screen.getByText("evidence.pdf")).toBeInTheDocument();
    expect(screen.getByText("5 B")).toBeInTheDocument();
  });

  it("removes an uploaded file and reports its id", async () => {
    const onRemoved = vi.fn();
    render(<DocumentUploader onRemoved={onRemoved} />);

    selectFiles([new File(["hello"], "evidence.pdf", { type: "application/pdf" })]);

    const remove = await screen.findByRole("button", {
      name: "Remove evidence.pdf",
    });
    fireEvent.click(remove);

    expect(onRemoved).toHaveBeenCalledWith("doc-1");
    expect(screen.queryByText("evidence.pdf")).not.toBeInTheDocument();
  });

  it("aborts an in-flight upload when Cancel is clicked", async () => {
    let receivedSignal: AbortSignal | undefined;
    uploadMock.mockImplementation(
      (options) =>
        new Promise((_resolve, reject) => {
          receivedSignal = options.signal;
          options.signal?.addEventListener("abort", () => {
            reject(new DOMException("Upload cancelled", "AbortError"));
          });
        }),
    );

    render(<DocumentUploader />);
    selectFiles([new File(["hello"], "evidence.pdf", { type: "application/pdf" })]);

    const cancel = await screen.findByRole("button", {
      name: "Cancel upload of evidence.pdf",
    });
    fireEvent.click(cancel);

    expect(receivedSignal?.aborted).toBe(true);
    expect(await screen.findByText("Upload cancelled.")).toBeInTheDocument();
  });

  it("retries a failed upload", async () => {
    const onUploaded = vi.fn();
    uploadMock
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce({
        id: "doc-2",
        fileName: "evidence.pdf",
        size: 1024,
        mimeType: "application/pdf",
      });

    render(<DocumentUploader onUploaded={onUploaded} />);
    selectFiles([new File(["hello"], "evidence.pdf", { type: "application/pdf" })]);

    expect(await screen.findByText("Network unavailable")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry upload of evidence.pdf" }),
    );

    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalledWith(
        expect.objectContaining({ id: "doc-2" }),
      );
    });
  });

  it("shows an explicit message when the file limit is exceeded", async () => {
    render(<DocumentUploader maxFiles={1} />);

    selectFiles([
      new File(["a"], "first.pdf", { type: "application/pdf" }),
      new File(["b"], "second.pdf", { type: "application/pdf" }),
    ]);

    expect(
      await screen.findByText("You can attach up to 1 file."),
    ).toBeInTheDocument();
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("opens the file picker from the keyboard", () => {
    render(<DocumentUploader />);
    const input = screen.getByTestId(
      "document-uploader-input",
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.keyDown(screen.getByTestId("document-dropzone"), {
      key: "Enter",
    });

    expect(clickSpy).toHaveBeenCalled();
  });
});
