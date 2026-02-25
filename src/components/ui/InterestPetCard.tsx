export interface Pet {
    id: string;
    name: string;
    breed: string;
    age: string;
    location: string;
    category: string;
    imageUrl: string;
    isFavourite: boolean;
    isInterested: boolean;
    consent: "awaiting" | "granted";
    adoption: boolean;
}

interface PetCardProps {
    pet: Pet;
    onToggleInterested: (id: string) => void;
}

export function InterestPetCard({ pet, onToggleInterested }: PetCardProps) {
    return (
        <div className="flex flex-col bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
            {/* Image container with aspect ratio */}
            <div className="relative w-full pb-[85%] bg-gray-100 overflow-hidden group">
                <img
                    src={pet.imageUrl}
                    alt={pet.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Action Buttons Container */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {/* Interested (+) Button */}
                    <button
                        onClick={() => onToggleInterested(pet.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors active:scale-90 ${pet.isInterested ? "bg-[#0D1B2A] text-white" : "bg-[#FF4726] text-white hover:bg-gray-50"
                            }`}
                        aria-label={pet.isInterested ? "Remove interest" : "Mark as interested"}
                    >
                        {pet.isInterested ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* User avatar mockup overlay */}
                <div className="absolute top-[84px] right-4">
                    <div className="w-10 h-10 rounded-full bg-white p-[2px] shadow-sm">
                        <img src="/src/assets/owner.png" alt="Lister" className="w-full h-full rounded-full bg-[#0D1B2A] object-contain p-1" />
                    </div>
                </div>

                {/* Banners & Actions Container */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
                    {pet.consent === "awaiting" && (
                        <div className="w-full bg-white rounded-[10px] flex items-center justify-between px-4 py-3 shadow-md">
                            <div className="flex items-center gap-3">
                                <svg className="w-[20px] h-[20px] text-[#F3A534]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[#0D1B2A] font-semibold text-[14px]">Awaiting Consent</span>
                            </div>
                            <svg className="w-5 h-5 text-[#0D1B2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}

                    {pet.consent === "granted" && !pet.adoption && (
                        <div className="w-full bg-white rounded-[10px] flex items-center justify-between px-4 py-3 shadow-md">
                            <div className="flex items-center gap-3">
                                <svg className="w-[20px] h-[20px] text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-[#0D1B2A] font-semibold text-[14px]">Consent Granted</span>
                            </div>
                            <svg className="w-5 h-5 text-[#0D1B2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}

                    {pet.consent === "granted" && pet.adoption && (
                        <div className="w-full bg-white rounded-[10px] flex items-center justify-between px-4 py-3 shadow-md">
                            <div className="flex items-center gap-3">
                                <svg className="w-[20px] h-[20px] text-[#285CE0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[#0D1B2A] font-semibold text-[14px]">Adoption In-Progress</span>
                            </div>
                            <svg className="w-5 h-5 text-[#0D1B2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}

                    {pet.consent === "granted" && !pet.adoption && (
                        <button className="w-full bg-[#FF4726] text-white py-[14px] rounded-xl font-semibold text-[14px] hover:bg-[#E84D2A] transition-colors flex items-center justify-center gap-2">
                            <span>Start Adoption Process</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    )}
                    {pet.consent === "granted" && pet.adoption && (
                        <button className="w-full bg-[#E8E6F5] text-[#0D1B2A] py-[14px] rounded-xl font-semibold text-[14px] hover:bg-[#16A34A] transition-colors">
                            Confirmed Pet Recieved
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col gap-1">
                <h3 className="text-lg font-bold text-[#0D162B]">{pet.name}</h3>
                <p className="text-[13px] text-gray-500 font-medium">
                    {pet.breed}, {pet.age}
                </p>

                <div className="flex items-center gap-1.5 mt-3 text-gray-500">
                    <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[12px] font-medium">{pet.location}</span>
                </div>
            </div>
        </div>
    );
}
