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
});
