import { useState, useRef, type DragEvent, type KeyboardEvent, type ChangeEvent } from "react";

const DEFAULT_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
const ALLOWED_EXTENSIONS = /\.(pdf|jpe?g|png)$/i;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

interface FileUploadZoneProps {
    id: string;
    label?: string;
    accept?: string;
    maxFiles?: number;
    onChange: (files: File[]) => void;
    selectedFiles: File[];
    error?: string;
}

function isAllowedFile(file: File) {
    return ALLOWED_MIME_TYPES.has(file.type) || ALLOWED_EXTENSIONS.test(file.name);
}

function formatSelectedFiles(selectedFiles: File[]) {
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    if (selectedFiles.length > 1) return `${selectedFiles.length} files selected`;
    return null;
}

export function FileUploadZone({
    id,
    label,
    accept = DEFAULT_ACCEPT,
    maxFiles = 1,
    onChange,
    selectedFiles,
    error,
}: FileUploadZoneProps) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const selectedLabel = formatSelectedFiles(selectedFiles);
    const displayError = error ?? validationError;
    const isInvalid = Boolean(displayError);

    const resetValidation = () => setValidationError(null);

    const handleBrowse = () => {
        resetValidation();
        hiddenFileInput.current?.click();
    };

    const validateFiles = (incomingFiles: File[]) => {
        if (incomingFiles.length > maxFiles) {
            return `You can upload up to ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`;
        }

        for (const file of incomingFiles) {
            if (!isAllowedFile(file)) {
                return "Unsupported file type. PDF, JPG or PNG only.";
            }
        }

        return null;
    };

    const processFiles = (incomingFiles: File[]) => {
        const validationMessage = validateFiles(incomingFiles);
        if (validationMessage) {
            setValidationError(validationMessage);
            return;
        }

        setValidationError(null);
        onChange(incomingFiles);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        processFiles(files);
        e.target.value = "";
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files || []);
        if (files.length === 0) return;

        processFiles(files);
        e.dataTransfer.clearData();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBrowse();
        }
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label htmlFor={id} className="text-[13px] font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <div
                role="button"
                tabIndex={0}
                aria-label="Upload files. Drag and drop or click to browse"
                onClick={handleBrowse}
                onKeyDown={handleKeyDown}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full cursor-pointer rounded-xl border-2 border-dashed bg-white px-6 py-10 outline-none transition-all
          ${
              isDragOver
                  ? "border-[#0D162B] bg-gray-50"
                  : isInvalid
                  ? "border-red-400 bg-red-50/10"
                  : "border-gray-200 hover:border-gray-300"
          }
        `}
            >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-500">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                </div>

                <div className="text-center">
                    <span className="text-[14px] font-medium text-[#E84D2A] hover:underline">
                        Click to upload
                    </span>
                    <span className="text-[14px] text-gray-500">
                        {" "}or drag and drop
                    </span>
                </div>

                {selectedLabel ? (
                    <p className="mt-2 text-[13px] font-medium text-gray-900 border border-gray-200 rounded-md px-3 py-1.5 bg-gray-50 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate max-w-[200px]">{selectedLabel}</span>
                    </p>
                ) : (
                    <p className="text-[12px] text-gray-400 mt-1">PDF, JPG, PNG only</p>
                )}

                <input
                    id={id}
                    type="file"
                    accept={accept}
                    multiple={maxFiles > 1}
                    ref={hiddenFileInput}
                    onChange={handleChange}
                    className="hidden"
                    aria-invalid={isInvalid}
                    data-testid="file-input"
                />
            </div>

            {displayError && (
                <p className="text-xs text-red-500 mt-0.5">
                    {displayError}
                </p>
            )}
        </div>
    );
}
