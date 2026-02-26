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
    if (!isOpen) return null;
    if (!data) return null;

    const [activeTab, setActiveTab] = useState<ListingTab>("pet");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="listing-details-title"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                    <h2 id="listing-details-title" className="text-xl font-semibold text-[#0D162B]">
                        Listing Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex border-b border-gray-200">
                    {(["pet", "transfer", "adopter"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-4 py-3 text-[13px] font-semibold transition-colors ${
                                activeTab === tab
                                    ? "text-[#0D162B] border-b-2 border-[#0D162B] bg-gray-50/50"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                            }`}
                        >
                            {tab === "pet" && "Pet Details"}
                            {tab === "transfer" && "Transfer Details"}
                            {tab === "adopter" && "Adopter's Details"}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-minimal">
                    {activeTab === "pet" && (
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 mb-6">
                                <img
                                    src={data.pet.imageUrl}
                                    alt={data.pet.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="w-full space-y-3 text-left">
                                <Row label="Pet Type" value={data.pet.petType} />
                                <Row label="Breed" value={data.pet.breed} />
                                <Row label="Age" value={data.pet.age} />
                                <Row label="Gender" value={data.pet.gender} />
                                <Row label="Vaccinated Status" value={data.pet.vaccinated} />
                            </div>
                        </div>
                    )}
                    {activeTab === "transfer" && (
                        <div className="space-y-3">
                            <Row label="Date Transferred" value={data.transfer.dateTransferred} />
                            <Row label="Transfer Location / Address" value={data.transfer.transferAddress} />
                        </div>
                    )}
                    {activeTab === "adopter" && (
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 mb-4">
                                <img
                                    src={data.adopter.imageUrl}
                                    alt={data.adopter.fullName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="w-full space-y-3 text-left">
                                <Row label="Full Name" value={data.adopter.fullName} />
                                {data.adopter.profileId && onAdopterClick ? (
                                    <div className="py-2">
                                        <p className="text-[13px] text-gray-400 mb-1">Location</p>
                                        <button
                                            type="button"
                                            onClick={() => onAdopterClick(data.adopter.profileId!)}
                                            className="text-[15px] font-semibold text-[#0D162B] hover:text-[#E84D2A] underline underline-offset-2"
                                        >
                                            {data.adopter.location}
                                        </button>
                                    </div>
                                ) : (
                                    <Row label="Location" value={data.adopter.location} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="py-2 border-b border-gray-100 last:border-0">
            <p className="text-[13px] text-gray-400 mb-0.5">{label}</p>
            <p className="text-[15px] font-semibold text-[#0D162B]">{value}</p>
        </div>
    );
}
