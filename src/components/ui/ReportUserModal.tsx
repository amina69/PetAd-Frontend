import { useState } from "react";
import { FormSelect } from "./formSelect";
import { SubmitButton } from "./submitButton";

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

type ModalState = "input" | "success";

const reportOptions = [
  { label: "Scam/Fraud", value: "scam" },
  { label: "Inappropriate Content", value: "inappropriate" },
  { label: "Fake Profile", value: "fake" },
  { label: "Animal Abuse Concern", value: "abuse" },
  { label: "Other", value: "other" },
];

export function ReportUserModal({
  isOpen,
  onClose,
  username,
}: ReportUserModalProps) {
  const [step, setStep] = useState<ModalState>("input");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; description?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!reason) newErrors.reason = "Report reason is required";

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.length > 1000) {
      newErrors.description = "Maximum 1000 characters allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    // Simulated API call
    await new Promise((res) => setTimeout(res, 1200));

    setIsLoading(false);
    setStep("success");
  };

  const handleClose = () => {
    setStep("input");
    setReason("");
    setDescription("");
    setErrors({});
    onClose();
  };

  const isFormValid =
    reason && description.trim() && description.length <= 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {step === "input" && (
        <div className="w-full max-w-[480px] bg-white rounded-2xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
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

          <h3 className="text-[24px] font-bold text-[#0D162B] mb-1">
            Report Account
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            All fields are required
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormSelect
              label="Report Reason"
              id="report-reason"
              options={reportOptions}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={errors.reason}
              placeholder="Select a reason"
            />

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="report-description"
                className="text-sm font-medium text-gray-500"
              >
                Context
              </label>

              <textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="Provide more details about issue..."
                className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all resize-none h-28
                  focus:border-[#0D1B2A] focus:ring-2 focus:ring-[#0D1B2A]/20
                  ${
                    errors.description
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                      : ""
                  }`}
              />

              <div className="flex justify-between items-center">
                {errors.description ? (
                  <p className="text-xs text-red-500">
                    {errors.description}
                  </p>
                ) : (
                  <span />
                )}

                <span className="text-xs text-gray-400">
                  {description.length}/1000
                </span>
              </div>
            </div>

            <SubmitButton
              label="Submit Report"
              loadingLabel="Submitting..."
              isLoading={isLoading}
              disabled={!isFormValid}
            />
          </form>
        </div>
      )}

      {step === "success" && (
        <div className="w-full max-w-[420px] bg-white rounded-2xl p-8 pt-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
          <h3 className="text-[28px] font-bold text-[#0D162B] mb-4">
            Report Submitted!
          </h3>

          <p className="text-gray-500 mb-8 max-w-[320px] text-[15px] leading-relaxed">
            You have successfully reported{" "}
            <span className="font-semibold">{username}</span> account.
            Our team will look into your report.
          </p>

          <button
            onClick={handleClose}
            className="w-full bg-[#E84D2A] text-white font-semibold text-[15px] py-4 rounded-xl hover:bg-[#d4431f] transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}