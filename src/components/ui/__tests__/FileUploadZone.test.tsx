import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileUploadZone } from '../FileUploadZone';

describe('FileUploadZone', () => {
  it('renders the upload zone with label', () => {
    render(
      <FileUploadZone
        id="test-upload"
        label="Upload Document"
        onChange={vi.fn()}
        selectedFiles={[]}
      />,
    );

    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(
      <FileUploadZone id="test-upload" onChange={vi.fn()} selectedFiles={[]} />,
    );

    expect(screen.getByText('Click to upload')).toBeInTheDocument();
  });

  it('shows selected file name when a file is provided', () => {
    const file = new File(['content'], 'test-file.pdf', { type: 'application/pdf' });
    render(
      <FileUploadZone id="test-upload" onChange={vi.fn()} selectedFiles={[file]} />,
    );

    expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
  });

  it('shows selected file count when multiple files are provided', () => {
    const files = [
      new File(['content'], 'file1.pdf', { type: 'application/pdf' }),
      new File(['content'], 'file2.png', { type: 'image/png' }),
    ];
    render(
      <FileUploadZone id="test-upload" onChange={vi.fn()} selectedFiles={files} maxFiles={2} />,
    );

    expect(screen.getByText('2 files selected')).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(
      <FileUploadZone
        id="test-upload"
        onChange={vi.fn()}
        selectedFiles={[]}
        error="File is too large"
      />,
    );

    expect(screen.getByText('File is too large')).toBeInTheDocument();
  });

  it('calls onChange when file is selected via click', () => {
    const onChange = vi.fn();
    render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} />,
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const file = new File(['content'], 'new-file.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it('accepts custom accept prop', () => {
    render(
      <FileUploadZone
        id="test-upload"
        onChange={vi.fn()}
        selectedFiles={[]}
        accept=".png,.jpg"
      />,
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', '.png,.jpg');
  });

  it('accepts a dropped file and calls onChange', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} />,
    );

    const zone = getByRole('button');
    const file = new File(['content'], 'dragged-file.pdf', { type: 'application/pdf' });
    const data = {
      dataTransfer: {
        files: [file],
        clearData: vi.fn(),
      },
    };

    fireEvent.drop(zone, data as unknown as DragEvent);

    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it('rejects unsupported file typing and shows validation error', () => {
    const onChange = vi.fn();
    render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} />,
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const badFile = new File(['content'], 'bad-file.gif', { type: 'image/gif' });

    fireEvent.change(input, { target: { files: [badFile] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Unsupported file type. PDF, JPG or PNG only.')).toBeInTheDocument();
  });

  it('rejects file sets over the maxFiles limit', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} maxFiles={1} />,
    );

    const zone = getByRole('button');
    const file1 = new File(['content'], 'file1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content'], 'file2.png', { type: 'image/png' });
    const data = {
      dataTransfer: {
        files: [file1, file2],
        clearData: vi.fn(),
      },
    };

    fireEvent.drop(zone, data as unknown as DragEvent);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('You can upload up to 1 file.')).toBeInTheDocument();
  });

  it('opens the file chooser when Enter is pressed', () => {
    const onChange = vi.fn();
    render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} />,
    );

    const zone = screen.getByRole('button');
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    zone.focus();
    fireEvent.keyDown(zone, { key: 'Enter' });

    expect(clickSpy).toHaveBeenCalled();
  });

  it('rejects oversized files with a specific error message', () => {
    const onChange = vi.fn();
    render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} maxFileSize={1024} />,
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    // Create a file larger than 1024 bytes
    const bigContent = new Uint8Array(2048).fill(65);
    const bigFile = new File([bigContent], 'big-file.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/File too large/)).toBeInTheDocument();
    expect(screen.getByText(/big-file\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/maximum is 1\.0 KB/)).toBeInTheDocument();
  });

  it('rejects a mix of valid and oversized files, reporting the first oversized one', () => {
    const onChange = vi.fn();
    render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} maxFiles={2} maxFileSize={1024} />,
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const smallFile = new File(['ok'], 'small.pdf', { type: 'application/pdf' });
    const bigContent = new Uint8Array(2048).fill(65);
    const bigFile = new File([bigContent], 'oversized.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [smallFile, bigFile] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/File too large/)).toBeInTheDocument();
    expect(screen.getByText(/oversized\.png/)).toBeInTheDocument();
  });

  it('defaults maxFileSize to 10 MB when not specified', () => {
    const onChange = vi.fn();
    render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} />,
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    // 11 MB file should be rejected with default limit
    const bigContent = new Uint8Array(11 * 1024 * 1024).fill(65);
    const bigFile = new File([bigContent], 'huge.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/File too large/)).toBeInTheDocument();
    expect(screen.getByText(/maximum is 10\.0 MB/)).toBeInTheDocument();
  });

  it('accepts files within the size limit', () => {
    const onChange = vi.fn();
    render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFiles={[]} maxFileSize={1024} />,
    );

    const input = screen.getByTestId('file-input') as HTMLInputElement;
    const smallFile = new File(['ok'], 'small.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [smallFile] } });

    expect(onChange).toHaveBeenCalledWith([smallFile]);
  });
});
