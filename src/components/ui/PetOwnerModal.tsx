interface PetOwnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownerImage: string;
}

export function PetOwnerModal({ isOpen, onClose, ownerImage }: PetOwnerModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-[420px] bg-white rounded-[24px] p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-300"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-[22px] font-bold text-[#0D162B]">
                        Pet Owner's Information
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Avatar */}
                <div className="flex justify-center mb-8">
                    <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-white shadow-sm ring-1 ring-gray-100">
                        <img
                            src={ownerImage}
                            alt="Pet Owner"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Information Fields */}
                <div className="flex flex-col gap-0 mb-8">

                    {/* Full Name */}
                    <div className="py-4 border-b border-gray-100 flex flex-col gap-1">
                        <span className="text-[14px] text-gray-400">Full Name</span>
                        <span className="text-[15px] font-semibold text-[#0D162B]">Angela Christoper</span>
                    </div>

                    {/* Email Address */}
                    <div className="py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[14px] text-gray-400">Email Address</span>
                            <span className="text-[15px] font-semibold text-[#0D162B] tracking-widest">*****</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#FFF0f0] text-[#0D162B] px-3 py-1.5 rounded-lg border border-[#FFEAEA]">
                            <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-[13px] font-medium">Masked</span>
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-[14px] text-gray-400">Phone Number</span>
                            <span className="text-[15px] font-semibold text-[#0D162B] tracking-widest">*****</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#FFF0f0] text-[#0D162B] px-3 py-1.5 rounded-lg border border-[#FFEAEA]">
                            <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-[13px] font-medium">Masked</span>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="py-4 flex flex-col gap-1">
                        <span className="text-[14px] text-gray-400">Location</span>
                        <span className="text-[15px] font-semibold text-[#0D162B]">Lagos, Nigeria</span>
                    </div>

                </div>

                {/* Report Action */}
                <button className="w-full bg-[#F3F4F6] text-[#6B7280] font-semibold text-[15px] py-4 rounded-xl hover:bg-gray-200 transition-colors">
                    Report Account
                </button>

            </div>
        </div>
    );
}
