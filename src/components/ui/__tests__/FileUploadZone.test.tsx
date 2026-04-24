import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileUploadZone } from "../FileUploadZone";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name: string, type: string, size = 1024): File {
  const file = new File(["x".repeat(size)], name, { type });
  return file;
}

function getZone() {
  return screen.getByTestId("file-upload-zone");
}

function getInput() {
  return screen.getByTestId("file-input") as HTMLInputElement;
}

function dropFiles(zone: HTMLElement, files: File[]) {
  fireEvent.drop(zone, {
    dataTransfer: { files },
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("FileUploadZone", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders the drop zone with correct role and aria-label", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} />);
    const zone = getZone();
    expect(zone).toHaveAttribute("role", "button");
    expect(zone).toHaveAttribute(
      "aria-label",
      "Upload files. Drag and drop or click to browse",
    );
  });

  it("renders an optional label above the zone", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} label="Evidence Files" />);
    expect(screen.getByText("Evidence Files")).toBeInTheDocument();
  });

  it("renders without a label when omitted", () => {
    const { container } = render(<FileUploadZone onFilesChange={vi.fn()} />);
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  it("passes the accept prop to the hidden input", () => {
    render(
      <FileUploadZone
        onFilesChange={vi.fn()}
        accept=".pdf,.jpg,.png"
      />,
    );
    expect(getInput()).toHaveAttribute("accept", ".pdf,.jpg,.png");
  });

  // ── Drag-and-drop ──────────────────────────────────────────────────────────

  it("highlights the zone on dragover and resets on dragleave", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} />);
    const zone = getZone();

    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute("data-dragging", "true");
    expect(zone.className).toContain("border-orange-400");

    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveAttribute("data-dragging");
    expect(zone.className).not.toContain("border-orange-400");
  });

  it("resets drag highlight after drop", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} />);
    const zone = getZone();

    fireEvent.dragOver(zone);
    dropFiles(zone, [makeFile("doc.pdf", "application/pdf")]);

    expect(zone).not.toHaveAttribute("data-dragging");
    expect(zone.className).not.toContain("border-orange-400");
  });

  // ── Accepted files ─────────────────────────────────────────────────────────

  it("accepts a valid PDF dropped onto the zone", () => {
    const onFilesChange = vi.fn();
    render(<FileUploadZone onFilesChange={onFilesChange} />);

    const file = makeFile("report.pdf", "application/pdf");
    dropFiles(getZone(), [file]);

    expect(onFilesChange).toHaveBeenCalledWith([file]);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("accepts a valid JPG dropped onto the zone", () => {
    const onFilesChange = vi.fn();
    render(<FileUploadZone onFilesChange={onFilesChange} />);

    const file = makeFile("photo.jpg", "image/jpeg");
    dropFiles(getZone(), [file]);

    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it("accepts a valid PNG dropped onto the zone", () => {
    const onFilesChange = vi.fn();
    render(<FileUploadZone onFilesChange={onFilesChange} />);

    const file = makeFile("image.png", "image/png");
    dropFiles(getZone(), [file]);

    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it("calls onFilesChange when a file is selected via the hidden input", () => {
    const onFilesChange = vi.fn();
    render(<FileUploadZone onFilesChange={onFilesChange} />);

    const file = makeFile("contract.pdf", "application/pdf");
    fireEvent.change(getInput(), { target: { files: [file] } });

    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  // ── MIME type rejection ────────────────────────────────────────────────────

  it("rejects a file with an unsupported MIME type and shows an error", () => {
    const onFilesChange = vi.fn();
    render(<FileUploadZone onFilesChange={onFilesChange} />);

    const bad = makeFile("virus.exe", "application/octet-stream");
    dropFiles(getZone(), [bad]);

    // Invalid file is NOT passed to the parent
    expect(onFilesChange).toHaveBeenCalledWith([]);
    // Error message is shown inline
    expect(
      screen.getByText("Unsupported type — PDF, JPG or PNG only"),
    ).toBeInTheDocument();
  });

  it("rejects a file with a spoofed extension but wrong MIME type", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} />);

    // wrong ext + wrong MIME — should be caught by MIME check
    const reallyBad = makeFile("script.sh", "text/x-shellscript");
    dropFiles(getZone(), [reallyBad]);

    expect(
      screen.getByText("Unsupported type — PDF, JPG or PNG only"),
    ).toBeInTheDocument();
  });

  // ── Max files enforcement ──────────────────────────────────────────────────

  it("enforces maxFiles and shows an error when the limit is exceeded", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} maxFiles={2} />);
    const zone = getZone();

    dropFiles(zone, [
      makeFile("a.pdf", "application/pdf"),
      makeFile("b.pdf", "application/pdf"),
      makeFile("c.pdf", "application/pdf"), // over limit
    ]);

    expect(screen.getByTestId("limit-error")).toHaveTextContent(
      "Maximum 2 files allowed",
    );
    // Only 2 valid entries in the list
    expect(screen.getAllByTestId("file-entry")).toHaveLength(2);
  });

  it("shows limit error when dropping files onto a full zone", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} maxFiles={1} />);
    const zone = getZone();

    dropFiles(zone, [makeFile("first.pdf", "application/pdf")]);
    dropFiles(zone, [makeFile("second.pdf", "application/pdf")]);

    expect(screen.getByTestId("limit-error")).toBeInTheDocument();
  });

  it("does not count rejected (invalid) files toward the max", () => {
    const onFilesChange = vi.fn();
    render(<FileUploadZone onFilesChange={onFilesChange} maxFiles={2} />);
    const zone = getZone();

    dropFiles(zone, [
      makeFile("bad.exe", "application/octet-stream"),
      makeFile("good.pdf", "application/pdf"),
    ]);

    // Only the valid file is published
    expect(onFilesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: "good.pdf" }),
    ]);
  });

  // ── Keyboard accessibility ─────────────────────────────────────────────────

  it("zone is focusable (tabIndex=0) when not at max", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} />);
    expect(getZone()).toHaveAttribute("tabindex", "0");
  });

  it("zone tabIndex becomes -1 when at max capacity", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} maxFiles={1} />);
    const zone = getZone();

    dropFiles(zone, [makeFile("a.pdf", "application/pdf")]);

    expect(zone).toHaveAttribute("tabindex", "-1");
    expect(zone).toHaveAttribute("aria-disabled", "true");
  });

  it("pressing Enter on the zone triggers the file browser", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} />);
    const zone = getZone();
    const input = getInput();

    const clickSpy = vi.spyOn(input, "click");
    fireEvent.keyDown(zone, { key: "Enter" });

    expect(clickSpy).toHaveBeenCalled();
  });

  it("pressing Space on the zone triggers the file browser", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} />);
    const zone = getZone();
    const input = getInput();

    const clickSpy = vi.spyOn(input, "click");
    fireEvent.keyDown(zone, { key: " " });

    expect(clickSpy).toHaveBeenCalled();
  });

  // ── File removal ───────────────────────────────────────────────────────────

  it("removes a file when its remove button is clicked", () => {
    const onFilesChange = vi.fn();
    render(<FileUploadZone onFilesChange={onFilesChange} />);

    const file = makeFile("remove-me.pdf", "application/pdf");
    dropFiles(getZone(), [file]);

    expect(screen.getByText("remove-me.pdf")).toBeInTheDocument();

    const removeBtn = screen.getByRole("button", { name: /remove remove-me\.pdf/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByText("remove-me.pdf")).not.toBeInTheDocument();
    expect(onFilesChange).toHaveBeenLastCalledWith([]);
  });

  // ── File counter ───────────────────────────────────────────────────────────

  it("shows a file counter after files are added", () => {
    render(<FileUploadZone onFilesChange={vi.fn()} maxFiles={5} />);

    dropFiles(getZone(), [
      makeFile("a.pdf", "application/pdf"),
      makeFile("b.png", "image/png"),
    ]);

    expect(screen.getByTestId("file-counter")).toHaveTextContent("2 / 5 files");
  });
});
