import { apiClient } from "../lib/api-client";
import type {
  AdoptionTimelineEntry,
  AdoptionDetails,
  AdoptionRequest,
  AdoptionStatus,
} from "../types/adoption";

export interface AdoptionRating {
  rating: number;
  feedback: string;
  adoptionId?: string;
  petId?: string;
}

export interface GetAdoptionListParams {
  status?: AdoptionStatus[];
}

export const adoptionService = {
  async getList(params: GetAdoptionListParams = {}): Promise<AdoptionRequest[]> {
    const searchParams = new URLSearchParams();

    params.status?.forEach((status) => {
      searchParams.append("status", status);
    });

    const query = searchParams.toString();
    const endpoint = `/adoption/requests${query ? `?${query}` : ""}`;

    return apiClient.get(endpoint);
  },

  async getDetails(adoptionId: string): Promise<AdoptionDetails> {
    return apiClient.get(`/adoption/${adoptionId}`);
  },

  async submitRating(ratingData: AdoptionRating): Promise<void> {
    // TODO: Replace with actual API endpoint
    console.log("Submitting rating:", ratingData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful submission
    return Promise.resolve();
  },

  async completeAdoption(adoptionId: string): Promise<void> {
    return apiClient.post(`/adoption/${adoptionId}/complete`);
  },

  async getTimeline(adoptionId: string): Promise<AdoptionTimelineEntry[]> {
    return apiClient.get(`/adoption/${adoptionId}/timeline`);
  },
};
