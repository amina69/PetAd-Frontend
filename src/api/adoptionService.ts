import { apiClient } from "../lib/api-client";
import type { AdoptionTimelineEntry, AdoptionDetails, ApprovalDecision, AdminApprovalQueueItem } from "../types/adoption";

export interface AdoptionRating {
  rating: number;
  feedback: string;
  adoptionId?: string;
  petId?: string;
}

export interface StatusOverride {
  status: string
  reason: string
}

export interface AdminApprovalFilters {
  shelter?: string;
  status?: string;
  overdueOnly?: boolean;
  cursor?: string;
}

export const adoptionService = {
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

   async editStatus(adoptionId: string, data: StatusOverride): Promise<AdoptionTimelineEntry[]> {
    return apiClient.patch(`/adoption/${adoptionId}/status`, data );
  },

  async getApprovals(adoptionId: string): Promise<ApprovalDecision[]> {
    return apiClient.get(`/adoption/${adoptionId}/approvals`);
  },

  async getAdminApprovalQueue(filters: AdminApprovalFilters): Promise<{ items: AdminApprovalQueueItem[], nextCursor?: string }> {
    const params = new URLSearchParams();
    if (filters.shelter) params.append("shelter", filters.shelter);
    if (filters.status) params.append("status", filters.status);
    if (filters.overdueOnly) params.append("overdueOnly", "true");
    if (filters.cursor) params.append("cursor", filters.cursor);
    
    const queryString = params.toString();
    const endpoint = `/admin/approvals${queryString ? `?${queryString}` : ""}`;
    
    return apiClient.get(endpoint);
  },
};
