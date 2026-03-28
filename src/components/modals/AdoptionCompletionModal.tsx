import { useState } from "react";

interface AdoptionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: AdoptionCompletionData) => void;
  petName?: string;
}

export interface AdoptionCompletionData {
  dateTransferred: string;
  transferLocation: string;
}

type ModalState = "form" | "success";

export function AdoptionCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  petName,
}: AdoptionCompletionModalProps) {
  const [modalState, setModalState] = useState<ModalState>("form");
  const [formData, setFormData] = useState<AdoptionCompletionData>({
    dateTransferred: "",
    transferLocation: "",
  });
  const [errors, setErrors] = useState<Partial<AdoptionCompletionData>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Partial<AdoptionCompletionData> = {};
    if (!formData.dateTransferred.trim()) {
      newErrors.dateTransferred = "Date is required";
    }
    if (!formData.transferLocation.trim()) {
      newErrors.transferLocation = "Location is required";
    }
    return newErrors;
  };

  const handleConfirm = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onConfirm(formData);
    setModalState("success");
  };

  const handleCancel = () => {
    setModalState("form");
    setFormData({ dateTransferred: "", transferLocation: "" });
    setErrors({});
    onClose();
  };

  const handleChange = (
    field: keyof AdoptionCompletionData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSuccessClose = () => {
    setModalState("form");
    setFormData({ dateTransferred: "", transferLocation: "" });
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-5 right-5 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-gray-400"
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

        <div className="p-8">
          {modalState === "form" ? (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-[24px] font-bold text-[#0D162B] mb-2">
                  Confirm Adoption Completion
                </h2>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Please confirm that the adoption process has been completed
                  {petName && ` for ${petName}`}.
                </p>
              </div>

              {/* Date Pet Was Transferred */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Date Pet Was Transferred
                </label>
                <input
                  type="date"
                  value={formData.dateTransferred}
                  onChange={(e) =>
                    handleChange("dateTransferred", e.target.value)
                  }
                  className={`w-full px-4 py-3 rounded-xl border text-[14px] text-gray-700 outline-none focus:ring-2 focus:ring-[#E84D2A]/30 transition ${
                    errors.dateTransferred
                      ? "border-red-400"
                      : "border-gray-200"
                  }`}
                />
                {errors.dateTransferred && (
                  <p className="text-[12px] text-red-500 mt-1">
                    {errors.dateTransferred}
                  </p>
                )}
              </div>

              {/* Transfer Location */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Transfer Location
                </label>
                <textarea
                  placeholder="Enter the location where the pet was transferred"
                  value={formData.transferLocation}
                  onChange={(e) =>
                    handleChange("transferLocation", e.target.value)
                  }
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border text-[14px] text-gray-700 placeholder-gray-400 outline-none resize-none focus:ring-2 focus:ring-[#E84D2A]/30 transition ${
                    errors.transferLocation
                      ? "border-red-400"
                      : "border-gray-200"
                  }`}
                />
                {errors.transferLocation && (
                  <p className="text-[12px] text-red-500 mt-1">
                    {errors.transferLocation}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-800 text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl bg-[#E84D2A] text-white text-[14px] font-semibold hover:bg-[#d4431f] transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="text-center space-y-6 py-4">
              <div>
                <h2 className="text-[24px] font-bold text-[#0D162B] mb-3">
                  Adoption Completed!
                </h2>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  The adoption completion has been confirmed successfully.
                  Thank you for using PetAd!
                </p>
              </div>

              <button
                onClick={handleSuccessClose}
                className="w-full bg-[#E84D2A] text-white font-semibold text-[14px] py-3 rounded-xl hover:bg-[#d4431f] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
