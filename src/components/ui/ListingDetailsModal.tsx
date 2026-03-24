import { useState } from "react";

interface ListingDetailsData {
    pet: {
        imageUrl: string;
        name: string;
        petType: string;
        breed: string;
        age: string;
        gender: string;
        vaccinated: string;
    };
    transfer: {
        dateTransferred: string;
        transferAddress: string;
    };
    adopter: {
        imageUrl: string;
        fullName: string;
        location: string;
        profileId?: string;
    };
}

interface ListingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ListingDetailsData | null;
    onAdopterClick?: (profileId: string) => void;
}

type ListingTab = "pet" | "transfer" | "adopter";

export function ListingDetailsModal({
    isOpen,
    onClose,
    data,
    onAdopterClick,
}: ListingDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<ListingTab>("pet");

    if (!isOpen) return null;
    if (!data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="w-full max-w-[500px] bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="listing-details-title"
            >
                <div className="flex items-center justify-between px-9 pt-9 pb-6 shrink-0">
                    <h2 id="listing-details-title" className="text-[36px] leading-[1.2] font-semibold text-[#0F2236]">
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
                        {(["pet", "transfer", "adopter"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 px-4 py-3 text-[14px] leading-6 border-r border-[#E4E7EC] last:border-r-0 transition-colors ${
                                    activeTab === tab
                                        ? "text-[#0F2236] bg-[#EAEAEA] font-medium"
                                        : "text-[#667085] bg-white hover:bg-[#F9FAFB] font-medium"
                                }`}
                            >
                                {tab === "pet" && "Pet Details"}
                                {tab === "transfer" && "Transfer Details"}
                                {tab === "adopter" && "Adopter's Details"}
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
                    {activeTab === "transfer" && (
                        <div className="pt-2">
                            <InlineRow label="Date Transferred" value={data.transfer.dateTransferred} />
                            <InlineRow label="Transfer Location / Address" value={data.transfer.transferAddress} isLast />
                        </div>
                    )}
                    {activeTab === "adopter" && (
                        <div>
                            <div className="w-[122px] h-[122px] rounded-xl overflow-hidden border border-[#E4E7EC] mb-6">
                                <img
                                    src={data.adopter.imageUrl}
                                    alt={data.adopter.fullName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="w-full">
                                <InlineRow label="Full Name" value={data.adopter.fullName} />
                                {data.adopter.profileId && onAdopterClick ? (
                                    <div className="grid grid-cols-[1fr_1.7fr] items-center py-3 border-b border-[#EAECF0]">
                                        <p className="text-[15px] leading-6 text-[#667085]">Location:</p>
                                        <button
                                            type="button"
                                            onClick={() => onAdopterClick(data.adopter.profileId!)}
                                            className="text-left text-[15px] leading-6 font-semibold text-[#0F2236] hover:text-[#0F2236]"
                                        >
                                            {data.adopter.location}
                                        </button>
                                    </div>
                                ) : (
                                    <InlineRow label="Location" value={data.adopter.location} isLast />
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
