import { useState } from "react";

interface IdentityVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type ModalState = 'input' | 'success' | 'failed';

export function IdentityVerificationModal({ isOpen, onClose, onSuccess }: IdentityVerificationModalProps) {
    const [step, setStep] = useState<ModalState>('input');
    const [nin, setNin] = useState("");

    if (!isOpen) return null;

    const handleVerifyNow = () => {
        // Validation logic: exactly 10 digits
        const isValid = nin.length === 10 && /^\d+$/.test(nin);
        if (isValid) {
            setStep('success');
        } else {
            setStep('failed');
        }
    };

    const handleClose = () => {
        setStep('input');
        setNin("");
        onClose();
    };

    const handleRetry = () => {
        setStep('input');
        setNin("");
    };

    const handleSuccessClose = () => {
        if (onSuccess) onSuccess();
        handleClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {step === 'input' && (
                <div
                    className="w-full max-w-[480px] bg-white rounded-2xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-300"
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h3 className="text-[24px] font-bold text-[#0D162B] mb-1">
                        Verify Your Identity
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        All fields are required
                    </p>

                    <div className="bg-[#F2FAF6] text-[#0D162B] text-sm p-4 rounded-xl mb-6">
                        This is a required action due to the sensitivity of adoption, to further promote safety, trust, and responsible pet adoption
                    </div>

                    <div className="mb-8">
                        <label htmlFor="modal-nin" className="block text-sm font-medium text-gray-500 mb-2">
                            NIN (National Identity Number)
                        </label>
                        <input
                            id="modal-nin"
                            type="text"
                            value={nin}
                            onChange={(e) => setNin(e.target.value)}
                            placeholder="Enter your NIN"
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#0D1B2A] focus:ring-2 focus:ring-[#0D1B2A]/20"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3.5 rounded-xl border border-gray-300 text-[#0D162B] font-semibold text-sm hover:bg-gray-50 transition-colors"
                        >
                            Verify Later
                        </button>
                        <button
                            onClick={handleVerifyNow}
                            className="flex-1 py-3.5 rounded-xl bg-[#0D1B2A] text-white font-semibold text-sm hover:bg-gray-900 transition-colors"
                        >
                            Verify Now
                        </button>
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div
                    className="w-full max-w-[420px] bg-white rounded-2xl p-8 pt-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300"
                    role="dialog"
                    aria-modal="true"
                >
                    <h3 className="text-[28px] font-bold text-[#0D162B] mb-4">
                        Verification Successful!
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-[300px] text-[15px] leading-relaxed">
                        Your identity has been verified, you can proceed to List or Adopt.
                    </p>
                    <button
                        onClick={handleSuccessClose}
                        className="w-full bg-[#E84D2A] text-white font-semibold text-[15px] py-4 rounded-xl hover:bg-[#d4431f] transition-colors"
                    >
                        Back To Home
                    </button>
                </div>
            )}

            {step === 'failed' && (
                <div
                    className="w-full max-w-[420px] bg-white rounded-2xl p-8 pt-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300"
                    role="dialog"
                    aria-modal="true"
                >
                    <h3 className="text-[28px] font-bold text-[#0D162B] mb-4">
                        Verification Failed!
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-[300px] text-[15px] leading-relaxed">
                        We are unable to verify your identity due to incorrect identity number provided.
                    </p>
                    <div className="flex items-center gap-4 w-full">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3.5 rounded-xl border border-gray-300 text-[#0D162B] font-semibold text-[14px] hover:bg-gray-50 transition-colors"
                        >
                            Verify Later
                        </button>
                        <button
                            onClick={handleRetry}
                            className="flex-1 py-3.5 rounded-xl bg-[#E84D2A] text-white font-semibold text-[14px] hover:bg-[#d4431f] transition-colors"
                        >
                            Retry Verification
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
