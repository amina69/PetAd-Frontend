import { apiClient } from "../lib/api-client";
import type { PetSummary } from "../types/pet";

/**
 * petService — read-only access to the pet catalogue.
 *
 * Only the calls the custody flow needs live here for now; the file used to
 * be empty.
 */
export const petService = {
  /**
   * Fetch the summary of a single pet.
   *
   * @param petId - The ID of the pet.
   */
  async getPet(petId: string): Promise<PetSummary> {
    return apiClient.get<PetSummary>(`/pets/${encodeURIComponent(petId)}`);
  },
};
