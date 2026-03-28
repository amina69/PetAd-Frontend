import { apiClient } from "../lib/api-client";
import type { AdoptionTimelineEntry } from "../types/adoption";

export interface AdoptionRating {
  rating: number;
  feedback: string;
  adoptionId?: string;
  petId?: string;
}

export const adoptionService = {
  async submitRating(ratingData: AdoptionRating): Promise<void> {
    // TODO: Replace with actual API endpoint
    console.log("Submitting rating:", ratingData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return;
  },

  async completeAdoption(adoptionId: string): Promise<void> {
    // ✅ apiClient already handles response + errors
    await apiClient.post(`/adoption/${adoptionId}/complete`);
  },

  async getTimeline(adoptionId: string): Promise<AdoptionTimelineEntry[]> {
    // cast fetch response properly
    const response = (await fetch(
      `/api/adoption/${adoptionId}/timeline`
    )) as Response;

    if (!response.ok) {
      throw new Error("Failed to fetch timeline");
    }

    return response.json();
  },
};