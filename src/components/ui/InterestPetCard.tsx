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
  completed?: boolean;
}

type InterestStatus = "awaiting" | "granted" | "in-progress" | "completed";

function getInterestStatus(pet: Pet): InterestStatus {
  if (pet.completed) return "completed";
  if (pet.consent === "awaiting") return "awaiting";
  if (pet.consent === "granted" && !pet.adoption) return "granted";
  return "in-progress";
}

const STATUS_MAP: Record<
  InterestStatus,
  { label: string; textClass: string; bgClass: string; dotClass: string }
> = {
  awaiting: {
    label: "Awaiting Consent",
    textClass: "text-[#D97706]",
    bgClass: "bg-[#FFFBEB]",
    dotClass: "bg-[#F3A534]",
  },
  granted: {
    label: "Consent Granted",
    textClass: "text-[#16A34A]",
    bgClass: "bg-[#F0FDF4]",
    dotClass: "bg-[#22C55E]",
  },
  "in-progress": {
    label: "Adoption In-Progress",
    textClass: "text-[#2563EB]",
    bgClass: "bg-[#EFF6FF]",
    dotClass: "bg-[#285CE0]",
  },
  completed: {
    label: "Completed Adoption",
    textClass: "text-[#7C3AED]",
    bgClass: "bg-[#F3E8FF]",
    dotClass: "bg-[#8B5CF6]",
  },
};

interface InterestPetCardProps {
  pet: Pet;
  onRemove: (id: string) => void;
  onViewDetails: (id: string) => void;
  onStartAdoption: (id: string) => void;
  onConfirmCompletion: (id: string) => void;
  onRateAdoption?: (id: string, petName: string) => void;
}

export function InterestPetCard({
  pet,
  onRemove,
  onViewDetails,
  onStartAdoption,
  onConfirmCompletion,
  onRateAdoption,
}: InterestPetCardProps) {
  const status = getInterestStatus(pet);
  const { label, textClass, bgClass, dotClass } = STATUS_MAP[status];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1.2fr_1.5fr] items-center gap-4 lg:gap-6 bg-white rounded-2xl border border-gray-100 p-4 lg:px-6 lg:py-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          <img
            src={pet.imageUrl}
            alt={pet.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-[#0D162B] truncate">
            {pet.name}
          </h3>
          <p className="text-[13px] text-gray-500 font-medium truncate">
            {pet.breed}, {pet.age}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-gray-500">
        <svg
          className="w-[14px] h-[14px] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-[13px] font-medium truncate">{pet.location}</span>
      </div>

      <div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${textClass} ${bgClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
        <button
          onClick={() => onViewDetails(pet.id)}
          className="px-4 py-2 text-[13px] font-semibold text-[#0D162B] bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
        >
          View Details
        </button>

        {status === "granted" && (
          <button
            onClick={() => onStartAdoption(pet.id)}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-[#E84D2A] rounded-lg hover:bg-[#d4431f] transition-colors whitespace-nowrap"
          >
            Start Adoption
          </button>
        )}

        {status === "in-progress" && (
          <button
            onClick={() => onConfirmCompletion(pet.id)}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-[#0D1B2A] rounded-lg hover:bg-gray-900 transition-colors whitespace-nowrap"
          >
            Confirm Completion
          </button>
        )}

        {status === "completed" && onRateAdoption && (
          <button
            onClick={() => onRateAdoption(pet.id, pet.name)}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-[#E84D2A] rounded-lg hover:bg-[#d4431f] transition-colors whitespace-nowrap"
          >
            Rate Adoption
          </button>
        )}

        <button
          onClick={() => onRemove(pet.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Remove from interests"
        >
          <svg
            className="w-[18px] h-[18px]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
