import { apiClient } from "../lib/api-client";
import { NotFoundError } from "../lib/api-errors";
import {
  approvalRequestSchema,
  approvalListResponseSchema,
} from "../lib/approvalSchema";
import type {
  ApprovalRequest,
  ApprovalListParams,
  RejectRequestInput,
} from "../types/approval";

export const approvalService = {
  async getApprovals(params: ApprovalListParams): Promise<ApprovalRequest[]> {
    const searchParams = new URLSearchParams();
    if (params.status) {
      params.status.forEach((s) => searchParams.append("status", s));
    }
    if (params.shelterId) searchParams.set("shelterId", params.shelterId);
    if (params.petId) searchParams.set("petId", params.petId);
    if (params.adopterId) searchParams.set("adopterId", params.adopterId);
    if (params.limit !== undefined)
      searchParams.set("limit", String(params.limit));
    if (params.offset !== undefined)
      searchParams.set("offset", String(params.offset));

    const queryString = searchParams.toString();
    const endpoint = `/approvals${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<unknown>(endpoint);
    return approvalListResponseSchema.parse(response);
  },

  async getApprovalById(id: string): Promise<ApprovalRequest> {
    try {
      const response = await apiClient.get<unknown>(`/approvals/${id}`);
      return approvalRequestSchema.parse(response);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ApiError" &&
        "status" in error &&
        (error as { status: number }).status === 404
      ) {
        throw new NotFoundError(
          "This request is no longer available. It may have been deleted or expired.",
          { status: 404, code: "NOT_FOUND" },
        );
      }
      throw error;
    }
  },

  async approveRequest(id: string): Promise<ApprovalRequest> {
    const response = await apiClient.post<unknown>(`/approvals/${id}/approve`);
    return approvalRequestSchema.parse(response);
  },

  async rejectRequest(
    id: string,
    payload: RejectRequestInput,
  ): Promise<ApprovalRequest> {
    const response = await apiClient.post<unknown>(
      `/approvals/${id}/reject`,
      payload,
    );
    return approvalRequestSchema.parse(response);
  },
};
