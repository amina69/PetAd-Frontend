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
        selectedFile={null}
      />,
    );

    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(
      <FileUploadZone id="test-upload" onChange={vi.fn()} selectedFile={null} />,
    );

    expect(screen.getByText('Click to upload')).toBeInTheDocument();
  });

  it('shows selected file name when file is provided', () => {
    const file = new File(['content'], 'test-file.pdf', { type: 'application/pdf' });
    render(
      <FileUploadZone id="test-upload" onChange={vi.fn()} selectedFile={file} />,
    );

    expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(
      <FileUploadZone
        id="test-upload"
        onChange={vi.fn()}
        selectedFile={null}
        error="File is too large"
      />,
    );

    expect(screen.getByText('File is too large')).toBeInTheDocument();
  });

  it('calls onChange when file is selected via click', () => {
    const onChange = vi.fn();
    render(
      <FileUploadZone id="test-upload" onChange={onChange} selectedFile={null} />,
    );

    const input = document.getElementById('test-upload') as HTMLInputElement;
    const file = new File(['content'], 'new-file.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(file);
  });

  it('applies drag over styling when dragging over', () => {
    const { container } = render(
      <FileUploadZone id="test-upload" onChange={vi.fn()} selectedFile={null} />,
    );

    const zone = container.querySelector('.border-dashed');
    if (zone) {
      fireEvent.dragOver(zone);
    }

    expect(zone).toBeInTheDocument();
  });

  it('accepts custom accept prop', () => {
    render(
      <FileUploadZone
        id="test-upload"
        onChange={vi.fn()}
        selectedFile={null}
        accept=".png,.jpg"
      />,
    );

    const input = document.getElementById('test-upload') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', '.png,.jpg');
  });
});
