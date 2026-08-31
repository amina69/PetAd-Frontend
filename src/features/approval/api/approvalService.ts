import { apiClient } from "../../../lib/api-client";
import type { ApprovalListParams, ApprovalListResponse } from "../types/approval.types";

export const approvalService = {
  /**
   * Fetch a list of approvals with optional filters and pagination.
   * @param params - Filters and pagination options (status, page, limit, etc.)
   */
  async getApprovals(params: ApprovalListParams = {}): Promise<ApprovalListResponse> {
    const searchParams = new URLSearchParams();

    if (params.status) {
      searchParams.append("status", params.status);
    }
    if (params.page !== undefined && params.page !== null) {
      searchParams.append("page", String(params.page));
    }
    if (params.limit !== undefined && params.limit !== null) {
      searchParams.append("limit", String(params.limit));
    }
    if (params.role) {
      searchParams.append("role", params.role);
    }
    if (params.search) {
      searchParams.append("search", params.search);
    }
    if (params.shelter) {
      searchParams.append("shelter", params.shelter);
    }
    if (params.overdueOnly !== undefined && params.overdueOnly !== null) {
      searchParams.append("overdueOnly", String(params.overdueOnly));
    }

    Object.entries(params).forEach(([key, value]) => {
      if (
        !["status", "page", "limit", "role", "search", "shelter", "overdueOnly"].includes(key) &&
        value !== undefined &&
        value !== null
      ) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/approvals${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<ApprovalListResponse>(endpoint);
  },
};
