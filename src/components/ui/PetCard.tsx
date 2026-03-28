import mockOwnerImg from "../../assets/mockownder.png";
import { Heart } from 'lucide-react';

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
}

interface PetCardProps {
    pet: Pet;
    onToggleFavourite: (id: string) => void;
    onToggleInterested: (id: string) => void;
    onOwnerClick?: () => void;
}

export function PetCard({ pet, onToggleFavourite, onToggleInterested, onOwnerClick }: PetCardProps) {

    return (
        <div className="flex flex-col bg-white rounded-[20px] w-[305px] overflow-hidden border border-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
            {/* Image container with aspect ratio */}
            <div className="relative w-full pb-[85%] h-[260px] bg-gray-100 overflow-hidden group">
                <img
                    src={pet.imageUrl}
                    alt={pet.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Action Buttons Container */}
                <div className="absolute top-4 right-4 flex flex-col gap-[16px]">
                    {/* Favourite Button */}
                    <button
                        onClick={() => onToggleFavourite(pet.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${pet.isFavourite ? "bg-[#FF5A36] text-white" : "bg-white text-gray-400 hover:text-[#FF5A36]"
                            }`}
                        aria-label={pet.isFavourite ? "Remove from favourites" : "Add to favourites"}
                    >
                        <Heart size={24}/>
                    </button>

                    {/* Interested (+) Button */}
                    <button
                        onClick={() => onToggleInterested(pet.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors active:scale-90 ${pet.isInterested ? "bg-[#0D1B2A] text-white" : "bg-white text-[#0D1B2A] hover:bg-gray-50"
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
                    {/* User avatar mockup overlay (bottom right of image) */}
                    <button
                        onClick={onOwnerClick}
                        className="w-10 h-10 rounded-full bg-white p-[0.5px] shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/50"
                        aria-label="View Pet Owner Information"
                    >
                        <img src={mockOwnerImg} alt="Lister" className="w-full h-full rounded-full object-cover" />
                    </button>
                </div>

            </div>

            {/* Content Area */}
            <div className="p-[20px] flex flex-col gap-[8px]">
                <div>
                    <h3 className="text-lg font-bold text-[#001323]">{pet.name}</h3>
                    <p className="text-[13px] text-[#686677] font-medium">
                        {pet.breed}, {pet.age}
                    </p>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500">
                    <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[12px] text-[#001323] font-medium">{pet.location}</span>
                </div>
            </div>
        </div>
    );
}
