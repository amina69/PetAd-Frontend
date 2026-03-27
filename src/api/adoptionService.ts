import { apiClient } from "../lib/api-client";

import type { 
  ApprovalDecisionPayload, 
  AdoptionRating, 
  AdoptionTimelineEntry 
} from "../types/adoption";

export const adoptionService = {
  async submitRating(ratingData: AdoptionRating): Promise<void> {
    // TODO: Replace with actual API endpoint
    console.log("Submitting rating:", ratingData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful submission
    return Promise.resolve();
  },

async approveAdoption(id: string, payload: ApprovalDecisionPayload): Promise<void> {
  return apiClient.post(`/adoption/${id}/approve`, payload);
},

async completeAdoption(adoptionId: string): Promise<void> {
  const response = await apiClient.post(`/adoption/${adoptionId}/complete`);
  if (!response.ok) {
    throw new Error("Failed to update adoption");
  }
  return response.json();
},

async getTimeline(adoptionId: string): Promise<AdoptionTimelineEntry[]> {
  const response = await fetch(`/api/adoption/${adoptionId}/timeline`);
  if (!response.ok) {
    throw new Error("Failed to fetch timeline");
  }
  return response.json();
}