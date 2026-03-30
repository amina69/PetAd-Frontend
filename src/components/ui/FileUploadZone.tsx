import { useState, useRef, type DragEvent, type ChangeEvent } from "react";

interface FileUploadZoneProps {
    id: string;
    label?: string;
    accept?: string;
    onChange: (file: File | null) => void;
    selectedFile: File | null;
    error?: string;
}

export function FileUploadZone({
    id,
    label,
    accept = "image/*,.pdf,.doc,.docx",
    onChange,
    selectedFile,
    error,
}: FileUploadZoneProps) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleClick = () => {
        hiddenFileInput.current?.click();
    };

    const handleFile = (file: File | undefined) => {
        if (!file) return;
        onChange(file);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const fileUploaded = e.target.files?.[0];
        handleFile(fileUploaded);
        // Reset input value to allow selecting the same file again if removed
        if (e.target) {
            e.target.value = '';
        }
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

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
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
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full cursor-pointer rounded-xl border-2 border-dashed bg-white px-6 py-10 outline-none transition-all
          ${
              isDragOver
                  ? "border-[#0D162B] bg-gray-50"
                  : error
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
                
                {selectedFile ? (
                    <p className="mt-2 text-[13px] font-medium text-gray-900 border border-gray-200 rounded-md px-3 py-1.5 bg-gray-50 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    </p>
                ) : (
                    <p className="text-[12px] text-gray-400 mt-1">SVG, PNG, JPG or PDF (max. 10MB)</p>
                )}

                <input
                    id={id}
                    type="file"
                    accept={accept}
                    ref={hiddenFileInput}
                    onChange={handleChange}
                    className="hidden"
                    aria-invalid={!!error}
                />
            </div>

            {error && (
                <p className="text-xs text-red-500 mt-0.5">
                    {error}
                </p>
            )}
        </div>
    );
}
