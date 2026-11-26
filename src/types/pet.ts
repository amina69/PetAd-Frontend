export interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  status: string;
  interests: number;
  imageUrl: string;
}

export type PetAvailability = "AVAILABLE" | "PENDING" | "IN_CUSTODY" | "ADOPTED";

export interface PetAvailabilityEvent {
  id: string;
  petId: string;
  previousAvailability: PetAvailability | null;
  newAvailability: PetAvailability;
  source: "adoption" | "custody" | "computed";
  reason: string;
  timestamp: string;
  
}
