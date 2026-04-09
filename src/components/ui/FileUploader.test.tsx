import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import FileUploader from './FileUploader';

describe('FileUploader', () => {
  const mockOnFilesSelected = vi.fn();

  beforeEach(() => {
    mockOnFilesSelected.mockClear();
  });

  it('renders the dropzone with correct aria-label', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    expect(dropzone).toBeInTheDocument();
  });

  it('highlights on drag over', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass('dropzoneDragging');
  });

  it('resets highlight on drag leave', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    fireEvent.dragOver(dropzone);
    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('dropzoneDragging');
  });

  it('resets highlight on drop', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    fireEvent.dragOver(dropzone);
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = {
      files: [file],
    };
    fireEvent.drop(dropzone, { dataTransfer });
    expect(dropzone).not.toHaveClass('dropzoneDragging');
  });

  it('calls onFilesSelected with valid files on drop', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = {
      files: [file],
    };
    fireEvent.drop(dropzone, { dataTransfer });
    expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('rejects invalid file type on drop', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const dataTransfer = {
      files: [file],
    };
    fireEvent.drop(dropzone, { dataTransfer });
    expect(mockOnFilesSelected).toHaveBeenCalledWith([], 'Invalid file type. Please upload files with accepted formats.');
  });

  it('rejects when exceeding maxFiles on drop', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={1} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
    const dataTransfer = {
      files: [file1, file2],
    };
    fireEvent.drop(dropzone, { dataTransfer });
    expect(mockOnFilesSelected).toHaveBeenCalledWith([], 'Maximum 1 files allowed.');
  });

  it('triggers file input on Enter key', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    const input = screen.getByDisplayValue(''); // hidden input
    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.keyDown(dropzone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('triggers file input on Space key', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    const input = screen.getByDisplayValue(''); // hidden input
    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.keyDown(dropzone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('handles file input change with valid files', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const input = screen.getByDisplayValue(''); // hidden input
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('handles file input change with invalid files', () => {
    render(<FileUploader accept=".pdf,.jpg" maxFiles={3} onFilesSelected={mockOnFilesSelected} />);
    const input = screen.getByDisplayValue(''); // hidden input
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(mockOnFilesSelected).toHaveBeenCalledWith([], 'Invalid file type. Please upload files with accepted formats.');
  });
});