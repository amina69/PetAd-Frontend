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

const STATUS_MAP: Record<InterestStatus, { label: string }> = {
  awaiting: {
    label: "Awaiting Consent",
  },
  granted: {
    label: "Consent Granted",
  },
  "in-progress": {
    label: "Adoption In-Progress",
  },
  completed: {
    label: "Completed Adoption",
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
  const { label } = STATUS_MAP[status];
  const showStatusIcon = status === "awaiting" || status === "in-progress";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.2fr_1.2fr_1.5fr] items-center gap-4 lg:gap-6 bg-white rounded-2xl border border-[#EAEAEA] p-4 lg:p-0 lg:pr-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 lg:gap-0">
        <div className="w-14 h-14 rounded-xl lg:w-38 lg:h-25 lg:rounded-t-xl lg:rounded-bl-xl lg:rounded-tr-none lg:rounded-br-none overflow-hidden bg-white shrink-0">
          <img
            src={pet.imageUrl}
            alt={pet.name}
            className=" w-full h-full lg:w-32 lg:h-25 object-center"
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-[#0D162B] truncate">
            {pet.name}
          </h3>
          <p className="text-[12px] text-[#686677] font-normal truncate">
            {pet.breed}, {pet.age}
          </p>
            <button
            onClick={() => onViewDetails(pet.id)}
            className="text-[12px] font-normal text-[#001323] hover:text-[#0D162B] cursor-pointer transition-colors mt-1 underline"
            >
            View Details
            </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-gray-500">
        <svg
          className="w-3.5 h-3.5 shrink-0"
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
          className="inline-flex items-center justify-between w-full max-w-70 px-3 py-1.5 rounded-full text-[14px] font-medium text-[#001323] bg-white"
        >
          <span className="inline-flex items-center gap-1.5 min-w-0">
            {showStatusIcon && (
              <svg
                className="w-4 h-4 shrink-0"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 14.5C6.27609 14.5 4.62279 13.8152 3.40381 12.5962C2.18482 11.3772 1.5 9.72391 1.5 8C1.5 6.27609 2.18482 4.62279 3.40381 3.40381C4.62279 2.18482 6.27609 1.5 8 1.5C9.72391 1.5 11.3772 2.18482 12.5962 3.40381C13.8152 4.62279 14.5 6.27609 14.5 8C14.5 9.72391 13.8152 11.3772 12.5962 12.5962C11.3772 13.8152 9.72391 14.5 8 14.5ZM0 8C0 5.87827 0.842855 3.84344 2.34315 2.34315C3.84344 0.842855 5.87827 0 8 0C10.1217 0 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C5.87827 16 3.84344 15.1571 2.34315 13.6569C0.842855 12.1566 0 10.1217 0 8ZM8 12C6.93913 12 5.92172 11.5786 5.17157 10.8284C4.42143 10.0783 4 9.06087 4 8H8V4C9.06087 4 10.0783 4.42143 10.8284 5.17157C11.5786 5.92172 12 6.93913 12 8C12 9.06087 11.5786 10.0783 10.8284 10.8284C10.0783 11.5786 9.06087 12 8 12Z"
                  fill="#F2C94C"
                />
              </svg>
            )}
            {status === "granted" && (
              <svg
                className="w-4 h-4 shrink-0"
                width="17"
                height="18"
                viewBox="0 0 17 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.3584 0.75L10.4596 2.2828L13.0608 2.278L13.8596 4.7532L15.9668 6.278L15.1584 8.75L15.9668 11.222L13.8596 12.7468L13.0608 15.222L10.4596 15.2172L8.3584 16.75L6.2572 15.2172L3.656 15.222L2.8572 12.7468L0.75 11.222L1.5584 8.75L0.75 6.278L2.8572 4.7532L3.656 2.278L6.2572 2.2828L8.3584 0.75Z"
                  stroke="#219653"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.55835 8.75L7.55835 10.75L11.5583 6.75"
                  stroke="#219653"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className="truncate">{label}</span>
          </span>
          <svg
            className="w-4 h-4 ml-3 shrink-0 cursor-pointer"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 15.9375C12.8315 15.9375 15.9375 12.8315 15.9375 9C15.9375 5.16852 12.8315 2.0625 9 2.0625C5.16852 2.0625 2.0625 5.16852 2.0625 9C2.0625 12.8315 5.16852 15.9375 9 15.9375Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M9 8.85986V12.6099"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M9 7.26611C9.51777 7.26611 9.9375 6.84638 9.9375 6.32861C9.9375 5.81085 9.51777 5.39111 9 5.39111C8.48223 5.39111 8.0625 5.81085 8.0625 6.32861C8.0625 6.84638 8.48223 7.26611 9 7.26611Z"
              fill="currentColor"
            />
          </svg>
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 flex-wrap lg:flex-nowrap">
        {status === "granted" && (
          <button
            onClick={() => onStartAdoption(pet.id)}
            className="inline-flex items-center justify-center gap-1.5 w-38.5 h-9 px-3 py-2 text-[12px] font-medium text-white bg-[#E84D2A] rounded-[5px] hover:bg-[#d4431f] transition-colors whitespace-nowrap"
          >
            <span>Start Adoption</span>
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M5 12H19M19 12L13 6M19 12L13 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {status === "in-progress" && (
          <button
            onClick={() => onConfirmCompletion(pet.id)}
            className="inline-flex items-center justify-center w-38.5 h-9 px-3 py-2 text-[12px] font-medium text-[#001323] bg-[#E8E6F5] rounded-[5px] hover:bg-[#E8E6F5] cursor-pointer transition-colors whitespace-nowrap"
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
          className={`p-2 rounded-lg transition-colors ${
            status !== "in-progress"
              ? "text-[#E61000] bg-[#E610000F] hover:bg-[#E610001A]"
              : "text-gray-400 bg-[#EAEAEA] hover:bg-[#EAEAEA]"
          }`}
          aria-label="Remove from interests"
        >
          <svg
            className="w-4.5 h-4.5"
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
