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
