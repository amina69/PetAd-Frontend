import { useState } from "react";

interface AdoptionDetailsData {
    pet: {
        imageUrl: string;
        name: string;
        petType: string;
        breed: string;
        age: string;
        gender: string;
        vaccinated: string;
    };
    receipt: {
        dateReceived: string;
        receiptAddress: string;
        petCondition: string;
    };
    lister: {
        imageUrl: string;
        fullName: string;
        location: string;
        profileId?: string;
    };
}

interface AdoptionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: AdoptionDetailsData | null;
    onListerClick?: (profileId: string) => void;
}

type AdoptionTab = "pet" | "receipt" | "lister";

export function AdoptionDetailsModal({
    isOpen,
    onClose,
    data,
    onListerClick,
}: AdoptionDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<AdoptionTab>("pet");

    if (!isOpen) return null;
    if (!data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="w-full max-w-[500px] bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="adoption-details-title"
            >
                <div className="flex items-center justify-between px-9 pt-9 pb-6 shrink-0">
                    <h2 id="adoption-details-title" className="text-[36px] leading-[1.2] font-semibold text-[#0F2236]">
                        Adoption Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 -mr-1 text-[#98A2B3] hover:text-[#667085] transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-9">
                    <div className="flex border border-[#E4E7EC] overflow-hidden rounded-[2px]">
                    {(["pet", "receipt", "lister"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-4 py-3 text-[14px] leading-6  border-r border-[#E4E7EC] last:border-r-0 transition-colors ${
                                activeTab === tab
                                    ? "text-[#0F2236] bg-[#EAEAEA] font-medium"
                                    : "text-[#667085] bg-white hover:bg-[#F9FAFB] font-medium"
                            }`}
                        >
                            {tab === "pet" && "Pet Details"}
                            {tab === "receipt" && "Receipts Details"}
                            {tab === "lister" && "Lister's Details"}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-9 pt-8 pb-9 scrollbar-minimal">
                    {activeTab === "pet" && (
                        <div>
                            <div className="w-[128px] h-[128px] rounded-xl overflow-hidden border border-[#E4E7EC] mb-6">
                                <img
                                    src={data.pet.imageUrl}
                                    alt={data.pet.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="w-full">
                                <InlineRow label="Pet Type" value={data.pet.petType} />
                                <InlineRow label="Breed" value={data.pet.breed} />
                                <InlineRow label="Age" value={data.pet.age} />
                                <InlineRow label="Gender" value={data.pet.gender} />
                                <InlineRow label="Vaccinated Status" value={data.pet.vaccinated} isLast />
                            </div>
                        </div>
                    )}
                    {activeTab === "receipt" && (
                        <div className="pt-2">
                            <InlineRow label="Date Received" value={data.receipt.dateReceived} />
                            <InlineRow label="Receipt Location / Address" value={data.receipt.receiptAddress} />
                            <InlineRow label="Pet Condition" value={data.receipt.petCondition} isLast />
                        </div>
                    )}
                    {activeTab === "lister" && (
                        <div>
                            <div className="w-[122px] h-[122px] rounded-xl overflow-hidden border border-[#E4E7EC] mb-6">
                                <img
                                    src={data.lister.imageUrl}
                                    alt={data.lister.fullName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="w-full">
                                <InlineRow label="Full Name" value={data.lister.fullName} />
                                {data.lister.profileId && onListerClick ? (
                                    <div className="grid grid-cols-[1fr_1.7fr] items-center py-3 border-b border-[#EAECF0]">
                                        <p className="text-[15px] leading-6 text-[#667085]">Location:</p>
                                        <button
                                            type="button"
                                            onClick={() => onListerClick(data.lister.profileId!)}
                                            className="text-left text-[15px] leading-6 font-semibold text-[#0F2236] hover:text-[#0F2236]"
                                        >
                                            {data.lister.location}
                                        </button>
                                    </div>
                                ) : (
                                    <InlineRow label="Location" value={data.lister.location} isLast />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InlineRow({
    label,
    value,
    isLast = false,
}: {
    label: string;
    value: string;
    isLast?: boolean;
}) {
    return (
        <div className={`grid grid-cols-[1fr_1.7fr] items-center py-3 ${isLast ? "" : "border-b border-[#EAECF0]"}`}>
            <p className="text-[15px] leading-6 text-[#667085]">{label}:</p>
            <p className="text-[15px] leading-6 font-semibold text-[#0F2236]">{value}</p>
        </div>
    );
}
