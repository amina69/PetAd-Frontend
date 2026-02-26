import { HeroBackgroundPaws } from "../components/home/HeroBackgroundPaws";
import { PetListingSection } from "../components/home/PetListingSection";
import { ListingModal } from "../components/listings/ListingModal";
import { PetOwnerModal } from "../components/ui/PetOwnerModal";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import mockOwnerImg from "../assets/mockownder.png";

export default function HomePage() {
    const navigate = useNavigate();
    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [showOwnerModal, setShowOwnerModal] = useState(false);

    return (
        <div className="min-h-screen bg-white">
            {/* ── Navbar Placeholder (if you have one later, it goes here) ── */}

            {/* ── Hero Section ── */}
            <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#FFF2E5] to-white lg:min-h-[500px] flex items-center">
                
                {/* ── Background Section ── */}
                <HeroBackgroundPaws />

                <div className="max-w-[1240px] w-full mx-auto px-6 lg:px-12 py-16 lg:py-24 relative z-10 flex flex-col justify-center">
                    <div className="max-w-[540px]">
                        <h1 className="text-[36px] lg:text-[44px] font-black leading-[1.15] tracking-[0.04em] text-[#0D162B] mb-5">
                            WELCOME PET LOVER!
                        </h1>
                        <p className="text-[17px] leading-[1.6] text-gray-700 font-medium mb-10 max-w-[480px]">
                            Research has shown that - those who keep pets for emotional support or companionship tend to live a longer life.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setIsListingModalOpen(true)}
                                className="bg-[#E84D2A] text-white font-semibold py-3.5 px-8 rounded-lg hover:bg-[#d4431f] transition-colors focus:ring-4 focus:ring-[#E84D2A]/20 active:scale-[0.98] whitespace-nowrap"
                            >
                                List For Adoption
                            </button>
                            <button
                                onClick={() => navigate("/listings")}
                                className="bg-[#0D1B2A] text-white font-semibold py-3.5 px-8 rounded-lg hover:bg-gray-900 transition-colors focus:ring-4 focus:ring-gray-900/20 active:scale-[0.98] whitespace-nowrap"
                            >
                                I Want To Adopt
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Available For Adoption Listing ── */}
            <PetListingSection onOwnerClick={() => setShowOwnerModal(true)} />

            <ListingModal
                isOpen={isListingModalOpen}
                onClose={() => setIsListingModalOpen(false)}
            />

            <PetOwnerModal
                isOpen={showOwnerModal}
                onClose={() => setShowOwnerModal(false)}
                ownerImage={mockOwnerImg}
            />
        </div>
    );
}
