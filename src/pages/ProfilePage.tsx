import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ownerImg from "../assets/owner.png";
import dogImg from "../assets/dog.png";
import { DocumentUploadModal } from "../components/modals";
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
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const adoptionDetails = adoptionDetailsId ? getAdoptionDetails(adoptionDetailsId) : null;
    const listingDetails = listingDetailsId ? getListingDetails(listingDetailsId) : null;

    const handleListerClick = (_profileId: string) => {
        void _profileId;
        setAdoptionDetailsId(null);
        navigate(`/profile`);
    };

    const handleAdopterClick = (_profileId: string) => {
        void _profileId;
        setListingDetailsId(null);
        navigate("/profile");
    };

    return (
        <div className="min-h-full bg-[#F7F7F8] py-6 sm:py-8 lg:py-10">
            <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6 lg:gap-7">

                <div className="w-full lg:w-[336px] border border-[#EBEDF0] rounded-xl px-6 py-7 sm:px-7 sm:py-8 bg-white flex flex-col items-center">

                    <div className="relative mb-5">
                        <div className="w-36 h-36 rounded-full overflow-hidden border border-[#EBEDF0]">
                            <img src={ownerImg} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-[#D6DAE0] text-[#4A5568] hover:text-[#0D162B] transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 2.625a1.5 1.5 0 113 3L12 15l-4 1 1-4 9.375-9.375z" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EAF8EE] text-[#2BA84A] rounded-md mb-7">
                        <span className="text-[16px] leading-5 font-semibold">Account Verified</span>
                        <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div className="w-full flex flex-col">
                        <div className="py-4 border-b border-[#ECEFF3]">
                            <p className="text-[16px] leading-5 text-[#98A1AF] mb-0.5">Full Name</p>
                            <p className="text-[16px] leading-8 font-semibold text-[#0D162B]">Angela Christoper</p>
                        </div>
                        <div className="py-4 border-b border-[#ECEFF3]">
                            <p className="text-[16px] leading-5 text-[#98A1AF] mb-0.5">Email Address</p>
                            <p className="text-[16px] leading-8 font-semibold text-[#0D162B]">Angela@gmail.com</p>
                        </div>
                        <div className="py-4 border-b border-[#ECEFF3]">
                            <p className="text-[16px] leading-5 text-[#98A1AF] mb-0.5">Phone Number</p>
                            <p className="text-[16px] leading-8 font-semibold text-[#0D162B]">+234 903 123 1233</p>
                        </div>
                        <div className="py-4 border-b border-[#ECEFF3]">
                            <p className="text-[16px] leading-5 text-[#98A1AF] mb-0.5">Location</p>
                            <p className="text-[16px] leading-8 font-semibold text-[#0D162B]">
                                24 Just Street, Lekki, Lagos, Nigeria
                            </p>
                        </div>
                        <div className="py-4">
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="w-full py-3 rounded-xl bg-white border-2 border-[#E84D2A] text-[#E84D2A] font-semibold text-[15px] hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Upload Document
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 border border-[#EBEDF0] rounded-xl bg-white overflow-hidden flex flex-col min-h-[560px]">

                    <div className="flex bg-white border-b border-[#ECEFF3]">
                        <button
                            onClick={() => setActiveTab("adoption")}
                            className={`px-5 sm:px-8 py-4 text-[18px] sm:text-[15px] leading-6 font-bold outline-none transition-colors border-r border-[#ECEFF3]
                                ${activeTab === "adoption"
                                    ? "bg-[#EAEAEA] text-[#0D162B]"
                                    : "bg-white text-[#7A8495] hover:bg-[#F8F9FA] hover:text-[#475467]"}`}
                        >
                            Adoption Record
                        </button>
                        <button
                            onClick={() => setActiveTab("listing")}
                            className={`px-5 sm:px-8 py-4 text-[18px] sm:text-[15px] leading-6 font-bold outline-none transition-colors border-r border-[#ECEFF3]
                                ${activeTab === "listing"
                                    ? "bg-[#EAEAEA] text-[#0D162B]"
                                    : "bg-white text-[#7A8495] hover:bg-[#F8F9FA] hover:text-[#475467]"}`}
                        >
                            Listing Record
                        </button>
                        <div className="flex-1 bg-white" />
                    </div>

                    {activeTab === "adoption" && adoptionRecords.length > 0 && (
                        <div className="flex-1 overflow-auto p-4 sm:p-5">
                            <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 text-[13px] leading-5 font-bold text-[#4D5761]">
                                <div className="text-[14px]">Details</div>
                                <div className="min-w-[120px] text-[14px]">Date Received</div>
                                <div className="min-w-[100px] text-[14px]">Action</div>
                            </div>
                            <ul className="space-y-3">
                                {adoptionRecords.map((record) => (
                                    <li key={record.id} className="px-3.5 sm:px-4 py-3 border border-[#ECEFF3] rounded-xl hover:bg-[#FAFAFA] transition-colors">
                                        <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_120px_100px] md:items-center md:gap-4">
                                            <div className="flex flex-1 items-center gap-4 min-w-0">
                                                <div className="w-14 h-14 rounded-md overflow-hidden shrink-0 bg-[#F3F4F6]">
                                                    <img src={record.petImage} alt={record.petName} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-[16px] leading-8 font-bold text-[#0D162B]">{record.petName}</h3>
                                                    <p className="text-[12px] leading-6 text-[#7A8495] mt-0.5">{record.petDescription}</p>
                                                </div>
                                            </div>
                                            <span className="text-[14px] leading-6 text-[#475467] md:justify-self-start">{record.dateReceived}</span>
                                            <button
                                                type="button"
                                                onClick={() => setAdoptionDetailsId(record.id)}
                                                className="text-left text-[14px] leading-6 font-medium text-[#1D2939] hover:text-[#0F1728] underline underline-offset-2 shrink-0 md:justify-self-start"
                                            >
                                                View Details
                                            </button>
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
                        <div className="flex-1 overflow-auto p-4 sm:p-5">
                            <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 text-[13px] leading-5 font-bold text-[#4D5761]">
                                <div className="text-[14px]">Details</div>
                                <div className="min-w-[120px] text-[14px]">Date Transferred</div>
                                <div className="min-w-[100px] text-[14px]">Action</div>
                            </div>
                            <ul className="space-y-3">
                                {listingRecords.map((record) => (
                                    <li key={record.id} className="px-3.5 sm:px-4 py-3 border border-[#ECEFF3] rounded-xl hover:bg-[#FAFAFA] transition-colors">
                                        <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_120px_100px] md:items-center md:gap-4">
                                            <div className="flex flex-1 items-center gap-4 min-w-0">
                                                <div className="w-14 h-14 rounded-md overflow-hidden shrink-0 bg-[#F3F4F6]">
                                                    <img src={record.petImage} alt={record.petName} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-[16px] leading-8 font-semibold text-[#0D162B]">{record.petName}</h3>
                                                    <p className="text-[12px] leading-6 text-[#7A8495] mt-0.5">{record.petDescription}</p>
                                                </div>
                                            </div>
                                            <span className="text-[14px] leading-6 text-[#475467] md:justify-self-start">{record.dateTransferred}</span>
                                            <button
                                                type="button"
                                                onClick={() => setListingDetailsId(record.id)}
                                                className="text-left text-[14px] leading-6 font-medium text-[#1D2939] hover:text-[#0F1728] underline underline-offset-2 shrink-0 md:justify-self-start"
                                            >
                                                View Details
                                            </button>
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
            <DocumentUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
            />
        </div>
    );
}
