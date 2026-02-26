import { useState } from "react";
import type { Pet } from "../ui/InterestPetCard";

interface StartAdoptionModalProps {
    pet: Pet | null;
    onConfirm: (id: string, formData: CompletionFormData) => void;
    onCancel: () => void;
}

export interface CompletionFormData {
    dateReceived: string;
    receiptLocation: string;
    petCondition: string;
}

export function StartAdoptionModal({
    pet,
    onConfirm,
    onCancel,
}: StartAdoptionModalProps) {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<CompletionFormData>({
        dateReceived: "",
        receiptLocation: "",
        petCondition: "",
    });
    const [errors, setErrors] = useState<Partial<CompletionFormData>>({});

    if (!pet) return null;

    const validate = () => {
        const newErrors: Partial<CompletionFormData> = {};
        if (!formData.dateReceived.trim())
            newErrors.dateReceived = "Date pet was received is required.";
        if (!formData.receiptLocation.trim())
            newErrors.receiptLocation = "Receipt location / address is required.";
        if (!formData.petCondition)
            newErrors.petCondition = "Pet condition is required.";
        return newErrors;
    };

    const handleConfirm = () => {
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});
        setSubmitted(true);
        onConfirm(pet.id, formData);
    };

    const handleChange = (
        field: keyof CompletionFormData,
        value: string
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(13, 22, 43, 0.55)" }}
            onClick={onCancel}
        >
            <div
                className="flex gap-6 items-start"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── LEFT PANEL: Completion Form (hidden after submit) ── */}
                {!submitted && <div className="relative bg-white rounded-2xl shadow-2xl w-[460px] p-8">
                    {/* Close button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    {/* Title */}
                    <h2 className="text-[22px] font-bold text-[#0D162B] mb-1">
                        Completion Form
                    </h2>
                    <p className="text-[13px] text-gray-400 mb-5">
                        All fields are required
                    </p>

                    {/* Info box */}
                    <div className="bg-[#F0FAF4] border border-[#C3E6CB] rounded-xl px-4 py-3 mb-6">
                        <p className="text-[13px] text-gray-700">
                            This information is required to confirm completion of
                            the adoption process
                        </p>
                    </div>

                    {/* Date Pet Was Received */}
                    <div className="mb-5">
                        <label className="block text-[13px] text-gray-500 mb-1.5">
                            Date Pet Was Received
                        </label>
                        <input
                            type="text"
                            placeholder="Enter"
                            value={formData.dateReceived}
                            onChange={(e) =>
                                handleChange("dateReceived", e.target.value)
                            }
                            className={`w-full px-4 py-3 rounded-xl border text-[14px] text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-[#E84D2A]/30 transition ${
                                errors.dateReceived
                                    ? "border-red-400"
                                    : "border-gray-200"
                            }`}
                        />
                        {errors.dateReceived && (
                            <p className="text-[12px] text-red-500 mt-1">
                                {errors.dateReceived}
                            </p>
                        )}
                    </div>

                    {/* Receipt Location / Address */}
                    <div className="mb-5">
                        <label className="block text-[13px] text-gray-500 mb-1.5">
                            Receipt Location / Address
                        </label>
                        <textarea
                            placeholder="Type something"
                            value={formData.receiptLocation}
                            onChange={(e) =>
                                handleChange("receiptLocation", e.target.value)
                            }
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl border text-[14px] text-gray-700 placeholder-gray-300 outline-none resize-none focus:ring-2 focus:ring-[#E84D2A]/30 transition ${
                                errors.receiptLocation
                                    ? "border-red-400"
                                    : "border-gray-200"
                            }`}
                        />
                        {errors.receiptLocation && (
                            <p className="text-[12px] text-red-500 mt-1">
                                {errors.receiptLocation}
                            </p>
                        )}
                    </div>

                    {/* Pet Condition */}
                    <div className="mb-8">
                        <label className="block text-[13px] text-gray-500 mb-1.5">
                            Pet Condition
                        </label>
                        <div className="relative">
                            <select
                                value={formData.petCondition}
                                onChange={(e) =>
                                    handleChange("petCondition", e.target.value)
                                }
                                className={`w-full appearance-none px-4 py-3 rounded-xl border text-[14px] text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#E84D2A]/30 transition ${
                                    errors.petCondition
                                        ? "border-red-400"
                                        : "border-gray-200"
                                } ${
                                    !formData.petCondition
                                        ? "text-gray-400"
                                        : "text-gray-700"
                                }`}
                            >
                                <option value="" disabled hidden>
                                    Select
                                </option>
                                <option value="excellent">Excellent</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Poor</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </div>
                        </div>
                        {errors.petCondition && (
                            <p className="text-[12px] text-red-500 mt-1">
                                {errors.petCondition}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-xl border-2 border-gray-800 text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-3 rounded-xl bg-[#0D162B] text-white text-[14px] font-bold hover:bg-[#1a2a4a] transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </div>}

                {/* ── RIGHT PANEL: Confirmation Submitted (shown after submit) ── */}
                {submitted && (
                    <div className="bg-white rounded-2xl shadow-2xl w-[380px] p-10 flex flex-col items-center text-center">
                        <h2 className="text-[22px] font-bold text-[#0D162B] mb-3">
                            Confirmation Submitted!
                        </h2>
                        <p className="text-[14px] text-gray-500 mb-7 leading-relaxed">
                            Your confirmation of the Pet Adoption completion
                            has been recieved
                        </p>
                        <button
                            onClick={onCancel}
                            className="w-full py-3 rounded-xl bg-[#E84D2A] text-white text-[14px] font-semibold hover:bg-[#d4431f] transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}