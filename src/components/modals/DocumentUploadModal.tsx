import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { documentService } from "../../api/documentService";
import { FileUploadZone } from "../ui/FileUploadZone";
import { ApiError, ValidationApiError } from "../../lib/api-errors";

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Mocking quota props, default to 32MB of 50MB
    usedQuotaMB?: number;
    totalQuotaMB?: number;
}

export function DocumentUploadModal({
    isOpen,
    onClose,
    usedQuotaMB = 32,
    totalQuotaMB = 50,
}: DocumentUploadModalProps) {
    const queryClient = useQueryClient();

    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState<string>("ID");
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const quotaPercentage = (usedQuotaMB / totalQuotaMB) * 100;
    const isQuotaFull = usedQuotaMB >= totalQuotaMB;

    // Progress bar color logic
    let progressColor = "bg-green-500";
    if (quotaPercentage >= 95) {
        progressColor = "bg-red-500";
    } else if (quotaPercentage >= 80) {
        progressColor = "bg-amber-500";
    }

    const resetState = () => {
        setFile(null);
        setDocType("ID");
        setProgress(0);
        setErrorMsg(null);
        setIsUploading(false);
    };

    const handleClose = () => {
        if (!isUploading) {
            resetState();
            onClose();
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setErrorMsg("Please select a file to upload.");
            return;
        }

        setIsUploading(true);
        setErrorMsg(null);
        setProgress(0);

        try {
            await documentService.uploadDocument({
                file,
                type: docType,
                onProgress: (pct) => {
                    setProgress(Math.round(pct));
                },
            });

            // On success
            await queryClient.invalidateQueries({ queryKey: ["documents"] });
            resetState();
            onClose();
        } catch (error) {
            setIsUploading(false);
            
            if (error instanceof ValidationApiError) {
                // If 422, specifically show scanner rejection
                setErrorMsg("File rejected by security scanner.");
            } else if (error instanceof ApiError) {
                setErrorMsg(error.message || "Failed to upload document.");
            } else {
                setErrorMsg("An unexpected error occurred during upload.");
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0D162B]/55 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div 
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-[480px] p-6 sm:p-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                {!isUploading && (
                    <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <h2 className="text-[22px] font-bold text-[#0D162B] mb-1">
                    Upload Document
                </h2>
                <p className="text-[14px] text-gray-500 mb-6">
                    Add new verification documents to your profile.
                </p>

                {/* Quota Indicator */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[13px] font-medium text-gray-700">Storage Quota</span>
                        <span className="text-[12px] text-gray-500 font-medium">
                            {usedQuotaMB} MB of {totalQuotaMB} MB used
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${progressColor}`} 
                            style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
                        ></div>
                    </div>
                    {isQuotaFull && (
                        <p className="text-[12px] text-red-500 mt-2 font-medium">
                            Storage capacity reached. Please delete old documents before adding new ones.
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-5">
                    {/* Document Type Select */}
                    <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                            Document Type
                        </label>
                        <div className="relative">
                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                disabled={isUploading || isQuotaFull}
                                className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#0D162B] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="ID">ID Document</option>
                                <option value="Vet records">Vet Records</option>
                                <option value="Adoption form">Adoption Form</option>
                                <option value="Other">Other</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* File Upload Zone */}
                    <div className={isQuotaFull || isUploading ? 'opacity-50 pointer-events-none' : ''}>
                        <FileUploadZone
                            id="document-upload"
                            label="Select File"
                            onChange={setFile}
                            selectedFile={file}
                        />
                    </div>

                    {/* Error Message */}
                    {errorMsg && (
                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2 text-red-600">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-[13px] font-medium">{errorMsg}</p>
                        </div>
                    )}

                    {/* Active Upload Progress */}
                    {isUploading && (
                        <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#ECEFF3]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[13px] font-medium text-gray-800 line-clamp-1 break-all">
                                    Uploading {file?.name}...
                                </span>
                                <span className="text-[12px] text-[#E84D2A] font-bold">
                                    {progress}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className="h-1.5 rounded-full bg-[#E84D2A] transition-all duration-300" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-2">
                        <button
                            onClick={handleClose}
                            disabled={isUploading}
                            className="w-full py-3 rounded-xl border-2 border-transparent text-[#7A8495] font-semibold text-[14px] hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading || isQuotaFull}
                            className="w-full py-3 rounded-xl bg-[#0D162B] text-white font-semibold text-[14px] hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 transition-colors shadow-sm relative overflow-hidden flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading
                                </>
                            ) : (
                                "Add Document"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
