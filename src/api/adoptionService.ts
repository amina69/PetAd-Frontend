import { apiClient } from "../lib/api-client";
import {
  adminApprovalQueueResponseSchema,
  approvalResponseSchema,
  type AdminApprovalQueueItem,
  type ApprovalResponse,
} from "../features/approval/schemas/approvalSchemas";
import type { AdoptionTimelineEntry, AdoptionDetails } from "../types/adoption";

export interface AdoptionRating {
  rating: number;
  feedback: string;
  adoptionId?: string;
  petId?: string;
}

export interface StatusOverride {
  status: string;
  reason: string;
}

export interface AdminApprovalFilters {
  shelter?: string;
  status?: string;
  overdueOnly?: boolean;
  cursor?: string;
  page?: number;
  pageSize?: number;
}

export const adoptionService = {
  async getDetails(adoptionId: string): Promise<AdoptionDetails> {
    return apiClient.get(`/adoption/${adoptionId}`);
  },

  async submitRating(ratingData: AdoptionRating): Promise<void> {
    console.log("Submitting rating:", ratingData);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  },

  async completeAdoption(adoptionId: string): Promise<void> {
    await apiClient.post(`/adoption/${adoptionId}/complete`);
  },

  // ✅ KEEP ONLY ONE VERSION (apiClient style)
  async getTimeline(adoptionId: string): Promise<AdoptionTimelineEntry[]> {
    return apiClient.get(`/adoption/${adoptionId}/timeline`);
  },

  async editStatus(
    adoptionId: string,
    data: StatusOverride
  ): Promise<AdoptionTimelineEntry[]> {
    return apiClient.patch(`/adoption/${adoptionId}/status`, data);
  },

  async getApprovals(adoptionId: string): Promise<ApprovalResponse[]> {
    const data = await apiClient.get<unknown>(
      `/adoption/${adoptionId}/approvals`
    );

    // Validate the API response at runtime to catch backend contract drift
    // before the data reaches the consuming hooks.
    return approvalResponseSchema.array().parse(data);
  },

  async getAdminApprovalQueue(
    filters: AdminApprovalFilters
  ): Promise<{ items: AdminApprovalQueueItem[]; nextCursor?: string | null; total?: number; page?: number; pageSize?: number }> {
    const params = new URLSearchParams();
    if (filters.shelter) params.append("shelter", filters.shelter);
    if (filters.status) params.append("status", filters.status);
    if (filters.overdueOnly) params.append("overdueOnly", "true");
    if (filters.cursor) params.append("cursor", filters.cursor);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.pageSize) params.append("pageSize", String(filters.pageSize));

    const queryString = params.toString();
    const endpoint = `/admin/approvals${queryString ? `?${queryString}` : ""}`;

    const data = await apiClient.get<unknown>(endpoint);
    return adminApprovalQueueResponseSchema.parse(data);
  },
};
