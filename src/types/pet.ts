export type PetAvailability = "AVAILABLE" | "PENDING" | "IN_CUSTODY" | "ADOPTED";

/**
 * The short description of a pet shown in headers and cards.
 */
export interface PetSummary {
  id: string;
  name: string;
  species?: string;
  breed?: string;
  age?: string;
  imageUrl?: string;
}

export interface PetAvailabilityEvent {
  id: string;
  petId: string;
  previousAvailability: PetAvailability | null;
  newAvailability: PetAvailability;
  source: "adoption" | "custody" | "computed";
  reason: string;
  timestamp: string;
  
}
