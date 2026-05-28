import { useApiQuery } from "./useApiQuery";
import { petAvailabilityService } from "../api/petService";
import type { PetAvailability } from "../types/pet";

export function usePetAvailability(petId: string) {
  return useApiQuery<PetAvailability>(["pet-availability", petId], () =>
    petAvailabilityService.resolve(petId),
  );
}
