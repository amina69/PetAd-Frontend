import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DocumentUploader } from "../DocumentUploader";

describe("DocumentUploader", () => {
  it("is usable with the keyboard file input", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn();
    render(
      <DocumentUploader
        kind="ID"
        onUploaded={onUploaded}
        uploadFile={async () => undefined}
      />,
    );

    const zone = screen.getByRole("button", {
      name: /upload documents/i,
    });
    zone.focus();
    expect(zone).toHaveFocus();

    const input = screen.getByTestId("document-uploader-input") as HTMLInputElement;
    const file = new File(["passport"], "passport.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalled();
    });
  });

  it("cancelling an upload aborts the request", async () => {
    const user = userEvent.setup();
    let capturedSignal: AbortSignal | undefined;
    const uploadFile = vi.fn((file: File, context: { signal: AbortSignal; onProgress: (n: number) => void }) => {
      capturedSignal = context.signal;
      return new Promise<void>((_resolve, reject) => {
        context.signal.addEventListener("abort", () => {
          reject(new DOMException("Upload cancelled", "AbortError"));
        });
      });
    });

    render(<DocumentUploader kind="ID" uploadFile={uploadFile} />);

    const input = screen.getByTestId("document-uploader-input") as HTMLInputElement;
    const file = new File(["passport"], "passport.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(capturedSignal?.aborted).toBe(true);
    expect(await screen.findByText("Cancelled")).toBeInTheDocument();
  });
});
