import React, { useState, useRef } from 'react';
import styles from './FileUploader.module.css';

interface FileUploaderProps {
  accept: string;
  maxFiles: number;
  onFilesSelected: (files: File[], error?: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ accept, maxFiles, onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    validateAndProcess(files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndProcess(files);
  };

  const validateAndProcess = (files: File[]) => {
    const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());
    const invalidFiles = files.filter(file => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      return !acceptedTypes.some(type =>
        fileType === type.replace('.', '') ||
        fileName.endsWith(type) ||
        (type.startsWith('.') && fileName.endsWith(type))
      );
    });

    if (invalidFiles.length > 0) {
      onFilesSelected([], 'Invalid file type. Please upload files with accepted formats.');
      return;
    }

    if (files.length > maxFiles) {
      onFilesSelected([], `Maximum ${maxFiles} files allowed.`);
      return;
    }

    onFilesSelected(files);
  };

  return (
    <div>
      <div
        className={isDragging ? styles.dropzoneDragging : styles.dropzone}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Upload files. Drag and drop or click to browse"
      >
        <p>Drag and drop files here or click to browse</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
    </div>
  );
};

export default FileUploader;