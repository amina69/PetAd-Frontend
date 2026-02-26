import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ownerImg from "../assets/owner.png";
import dogImg from "../assets/dog.png";
import { AdoptionDetailsModal } from "../components/ui/AdoptionDetailsModal";
import { ListingDetailsModal } from "../components/ui/ListingDetailsModal";

interface AdoptionRecordItem {
    id: string;
    petImage: string;
    petName: string;
    petDescription: string;
    dateReceived: string;
}

interface ListingRecordItem {
    id: string;
    petImage: string;
    petName: string;
    petDescription: string;
    dateTransferred: string;
}

const MOCK_ADOPTION_RECORDS: AdoptionRecordItem[] = [
    {
        id: "adopt-1",
        petImage: dogImg,
        petName: "Dog Pet",
        petDescription: "Dog, German Shepard, 4yrs old",
        dateReceived: "10 Jan 2025",
    },
    {
        id: "adopt-2",
        petImage: dogImg,
        petName: "Dog Pet",
        petDescription: "Dog, German Shepard, 4yrs old",
        dateReceived: "10 Jan 2025",
    },
];

const MOCK_LISTING_RECORDS: ListingRecordItem[] = [
    {
        id: "list-1",
        petImage: dogImg,
        petName: "Dog Pet",
        petDescription: "Dog, German Shepard, 4yrs old",
        dateTransferred: "10 Jan 2025",
    },
    {
        id: "list-2",
        petImage: dogImg,
        petName: "Dog Pet",
        petDescription: "Dog, German Shepard, 4yrs old",
        dateTransferred: "10 Jan 2025",
    },
];

function getAdoptionDetails(id: string) {
    const r = MOCK_ADOPTION_RECORDS.find((x) => x.id === id);
    if (!r) return null;
    return {
        pet: {
            imageUrl: r.petImage,
            name: r.petName,
            petType: "Dog",
            breed: "German Shepard",
            age: "4 Years Old",
            gender: "Female",
            vaccinated: "Yes",
        },
        receipt: {
            dateReceived: r.dateReceived,
            receiptAddress: "Fuse Road, Lagos Nigeria",
            petCondition: "Good",
        },
        lister: {
            imageUrl: ownerImg,
            fullName: "Angela Christopher",
            location: "Lagos, Nigeria",
            profileId: "lister-1",
        },
    };
}

function getListingDetails(id: string) {
    const r = MOCK_LISTING_RECORDS.find((x) => x.id === id);
    if (!r) return null;
    return {
        pet: {
            imageUrl: r.petImage,
            name: r.petName,
            petType: "Dog",
            breed: "German Shepard",
            age: "4 Years Old",
            gender: "Female",
            vaccinated: "Yes",
        },
        transfer: {
            dateTransferred: r.dateTransferred,
            transferAddress: "Fuse Road, Lagos Nigeria",
        },
        adopter: {
            imageUrl: ownerImg,
            fullName: "Angela Christopher",
            location: "Lagos, Nigeria",
            profileId: "adopter-1",
        },
    };
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"adoption" | "listing">("adoption");
    const [adoptionRecords] = useState<AdoptionRecordItem[]>(MOCK_ADOPTION_RECORDS);
    const [listingRecords] = useState<ListingRecordItem[]>(MOCK_LISTING_RECORDS);
    const [adoptionDetailsId, setAdoptionDetailsId] = useState<string | null>(null);
    const [listingDetailsId, setListingDetailsId] = useState<string | null>(null);

    const adoptionDetails = adoptionDetailsId ? getAdoptionDetails(adoptionDetailsId) : null;
    const listingDetails = listingDetailsId ? getListingDetails(listingDetailsId) : null;

    const handleListerClick = (_profileId: string) => {
        setAdoptionDetailsId(null);
        navigate(`/profile`);
    };

    const handleAdopterClick = (_profileId: string) => {
        setListingDetailsId(null);
        navigate("/profile");
    };

    return (
        <div className="min-h-screen flex flex-col pb-12">
            <div className="bg-white border-b border-gray-100 h-20 mb-8 shrink-0" />

            <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 lg:gap-8 flex-1">

                <div className="w-full md:w-[340px] lg:w-[380px] border border-gray-200 rounded-2xl p-6 sm:p-8 md:p-10 bg-white flex flex-col items-center shadow-sm">

                    <div className="relative mb-4">
                        <div className="w-60 h-60 rounded-full overflow-hidden border-4 border-white shadow-sm">
                            <img src={ownerImg} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute bottom-5 right-5 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] text-[#22C55E] rounded-md mb-8">
                        <span className="text-[13px] font-semibold tracking-wide">Account Verified</span>
                        <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div className="w-full flex flex-col">
                        <div className="py-4 border-b border-gray-100">
                            <p className="text-[13px] text-gray-400 mb-1">Full Name</p>
                            <p className="text-[15px] font-semibold text-[#0D162B]">Angela Christoper</p>
                        </div>
                        <div className="py-4 border-b border-gray-100">
                            <p className="text-[13px] text-gray-400 mb-1">Email Address</p>
                            <p className="text-[15px] font-semibold text-[#0D162B]">Angela@gmail.com</p>
                        </div>
                        <div className="py-4 border-b border-gray-100">
                            <p className="text-[13px] text-gray-400 mb-1">Phone Number</p>
                            <p className="text-[15px] font-semibold text-[#0D162B]">+234 903 123 1233</p>
                        </div>
                        <div className="py-4 pt-4">
                            <p className="text-[13px] text-gray-400 mb-1">Location</p>
                            <p className="text-[15px] font-semibold text-[#0D162B] leading-snug">
                                24 Just Street, Lekki, Lagos, Nigeria
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 border border-gray-200 rounded-2xl bg-white overflow-hidden flex flex-col shadow-sm min-h-[600px] md:h-[calc(100vh-140px)]">

                    <div className="flex bg-white">
                        <button
                            onClick={() => setActiveTab("adoption")}
                            className={`px-6 sm:px-8 py-5 text-[14px] sm:text-[15px] font-semibold outline-none transition-all border-r border-b border-gray-200
                                ${activeTab === "adoption"
                                    ? "bg-gray-50 text-[#0D162B] border-b-transparent focus:ring-0"
                                    : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
                        >
                            Adoption Record
                        </button>
                        <button
                            onClick={() => setActiveTab("listing")}
                            className={`px-6 sm:px-8 py-5 text-[14px] sm:text-[15px] font-semibold outline-none transition-all border-r border-b border-gray-200
                                ${activeTab === "listing"
                                    ? "bg-gray-50 text-[#0D162B] border-b-transparent focus:ring-0"
                                    : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
                        >
                            Listing Record
                        </button>
                        <div className="flex-1 border-b border-gray-200 bg-white" />
                    </div>

                    {activeTab === "adoption" && adoptionRecords.length > 0 && (
                        <div className="flex-1 overflow-auto">
                            <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                                <div>Details</div>
                                <div className="min-w-[120px]">Date Received</div>
                                <div className="min-w-[100px]">Action</div>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {adoptionRecords.map((record) => (
                                    <li key={record.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex flex-1 items-center gap-4 min-w-0">
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                                                    <img src={record.petImage} alt={record.petName} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-[15px] font-bold text-[#0D162B]">{record.petName}</h3>
                                                    <p className="text-[13px] text-gray-500 mt-0.5">{record.petDescription}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                                                <span className="text-[14px] text-gray-600 sm:min-w-[120px]">{record.dateReceived}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAdoptionDetailsId(record.id)}
                                                    className="text-[14px] font-semibold text-[#E84D2A] hover:text-[#d4431f] underline underline-offset-2 shrink-0"
                                                >
                                                    View Adoption Details
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeTab === "adoption" && adoptionRecords.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="text-[22px] sm:text-[24px] font-bold text-[#0D162B] mb-2 text-center">
                                You haven&apos;t adopted any pets yet.
                            </h3>
                            <p className="text-[15px] text-gray-500 mb-8 text-center max-w-md">
                                When you adopt a pet through PetAd, your adoption history will appear here.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/listings")}
                                className="w-full sm:w-auto min-w-[160px] px-8 py-3.5 bg-[#E84D2A] text-white font-semibold text-[15px] rounded-xl hover:bg-[#d4431f] transition-all hover:shadow-lg focus:ring-4 focus:ring-[#E84D2A]/20"
                            >
                                Explore Pets
                            </button>
                        </div>
                    )}

                    {activeTab === "listing" && listingRecords.length > 0 && (
                        <div className="flex-1 overflow-auto">
                            <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                                <div>Details</div>
                                <div className="min-w-[120px]">Date Transferred</div>
                                <div className="min-w-[100px]">Action</div>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {listingRecords.map((record) => (
                                    <li key={record.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex flex-1 items-center gap-4 min-w-0">
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                                                    <img src={record.petImage} alt={record.petName} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-[15px] font-bold text-[#0D162B]">{record.petName}</h3>
                                                    <p className="text-[13px] text-gray-500 mt-0.5">{record.petDescription}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                                                <span className="text-[14px] text-gray-600 sm:min-w-[120px]">{record.dateTransferred}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setListingDetailsId(record.id)}
                                                    className="text-[14px] font-semibold text-[#E84D2A] hover:text-[#d4431f] underline underline-offset-2 shrink-0"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {activeTab === "listing" && listingRecords.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-[22px] sm:text-[24px] font-bold text-[#0D162B] mb-2 text-center">
                                You haven&apos;t listed any pets yet.
                            </h3>
                            <p className="text-[15px] text-gray-500 mb-8 text-center max-w-md">
                                List a pet for adoption and your listings will appear here.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4">
                                <button
                                    type="button"
                                    onClick={() => navigate("/home")}
                                    className="w-full sm:w-auto min-w-[160px] px-8 py-3.5 bg-[#E84D2A] text-white font-semibold text-[15px] rounded-xl hover:bg-[#d4431f] transition-all hover:shadow-lg focus:ring-4 focus:ring-[#E84D2A]/20"
                                >
                                    List A Pet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate("/listings")}
                                    className="w-full sm:w-auto min-w-[160px] px-8 py-3.5 bg-[#0D1B2A] text-white font-semibold text-[15px] rounded-xl hover:bg-gray-900 transition-all hover:shadow-lg focus:ring-4 focus:ring-gray-900/20"
                                >
                                    Explore Pets
                                </button>
                            </div>
                        </div>
                    )}

                </div>

            </div>

            <AdoptionDetailsModal
                isOpen={!!adoptionDetailsId}
                onClose={() => setAdoptionDetailsId(null)}
                data={adoptionDetails}
                onListerClick={handleListerClick}
            />
            <ListingDetailsModal
                isOpen={!!listingDetailsId}
                onClose={() => setListingDetailsId(null)}
                data={listingDetails}
                onAdopterClick={handleAdopterClick}
            />
        </div>
    );
}
