import { useRef, type ChangeEvent } from "react";

interface FileUploadProps {
    id: string;
    label?: string;
    accept?: string;
    onChange: (file: File | null) => void;
    selectedFile: File | null;
    placeholder?: string;
    error?: string;
}

export function FileUpload({
    id,
    label,
    accept = "image/*",
    onChange,
    selectedFile,
    placeholder = "Select file",
    error,
}: FileUploadProps) {
    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        hiddenFileInput.current?.click();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const fileUploaded = e.target.files?.[0] || null;
        onChange(fileUploaded);
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label htmlFor={id} className="text-[13px] font-medium text-gray-500 mb-1">
                    {label}
                </label>
            )}

            <div
                onClick={handleClick}
                className={`flex items-center justify-between w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition-all
          hover:border-gray-300 focus-within:border-[#0D162B] focus-within:ring-1 focus-within:ring-[#0D162B]
          ${error ? "border-red-400 bg-red-50/10" : ""}
        `}
            >
                <span className={`text-[14px] truncate flex-1 pr-4 ${selectedFile ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                    {selectedFile ? selectedFile.name : placeholder}
                </span>

                <svg
                    className="w-5 h-5 text-gray-400 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>

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
