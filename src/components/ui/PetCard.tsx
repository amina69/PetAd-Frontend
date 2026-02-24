import mockOwnerImg from "../../assets/mockownder.png";

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
}

export function PetCard({ pet, onToggleFavourite, onToggleInterested }: PetCardProps) {
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
                    {/* Favourite Button */}
                    <button
                        onClick={() => onToggleFavourite(pet.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${pet.isFavourite ? "bg-[#FF5A36] text-white" : "bg-white text-gray-400 hover:text-[#FF5A36]"
                            }`}
                        aria-label={pet.isFavourite ? "Remove from favourites" : "Add to favourites"}
                    >
                        <svg
                            className="w-5 h-5"
                            fill={pet.isFavourite ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={pet.isFavourite ? 0 : 2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
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
                </div>

                {/* User avatar mockup overlay (bottom right of image) */}
                <div className="absolute bottom-4 right-4">
                    <div className="w-8 h-8 rounded-full bg-white p-[2px] shadow-sm">
                        <img src={mockOwnerImg} alt="Lister" className="w-full h-full rounded-full object-cover" />
                    </div>
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
