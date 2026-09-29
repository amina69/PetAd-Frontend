import { apiClient } from "../../../lib/api-client";
import { ApiError, NotFoundError } from "../../../lib/api-errors";
import type { ApprovalListParams, ApprovalListResponse } from "../types/approval.types";
import {
  approvalResponseSchema,
  rejectRequestSchema,
  type ApprovalResponse,
  type RejectRequest,
} from "../schemas/approvalSchemas";

/**
 * Payload accepted by `rejectRequest` (alias of the Zod-inferred
 * `RejectRequest`, exposed under the name used by issue #431).
 */
export type RejectRequestInput = RejectRequest;

/**
 * Normalises a failed approval request so the UI can branch on 404 without
 * having to know about HTTP status codes.
 *
 * A 404 means "this request has been deleted/expired", which the UI surfaces as
 * "This request is no longer available" rather than a generic error.
 *
 * Existing error classes (`src/lib/api-errors`) are reused — no new error type
 * is introduced.
 */
async function requestWithNotFound<T>(
  request: () => Promise<T>,
  id: string,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    if (error instanceof ApiError && error.status === 404) {
      throw new NotFoundError(
        `Approval request "${id}" is no longer available`,
        {
          status: 404,
          code: error.code ?? "APPROVAL_NOT_FOUND",
          data: error.data,
        },
      );
    }

    throw error;
  }
}

/**
 * `approvalService` — centralised API layer for the approvals domain.
 *
 * Every single-request method validates its response through
 * `approvalResponseSchema` (A2) before resolving, so contract drift surfaces at
 * the boundary instead of inside components. List responses return the typed
 * pagination envelope consumed by `useApprovalList`.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/431
 */
export const approvalService = {
  /**
   * Fetch a list of approvals with optional filters and pagination.
   * @param params - Filters and pagination options (status, page, limit, etc.)
   */
  async getApprovals(
    params: ApprovalListParams = {},
  ): Promise<ApprovalListResponse> {
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

  /**
   * Fetch a single approval request.
   *
   * Rejects with `NotFoundError` (status 404) when the request has been
   * deleted or has expired, so callers can render a specific message.
   */
  async getApprovalById(id: string): Promise<ApprovalResponse> {
    return requestWithNotFound(async () => {
      const data = await apiClient.get<unknown>(`/approvals/${id}`);
      return approvalResponseSchema.parse(data);
    }, id);
  },

  /**
   * Approve an approval request.
   *
   * Rejects with `NotFoundError` (status 404) when the request is gone.
   */
  async approveRequest(id: string): Promise<ApprovalResponse> {
    return requestWithNotFound(async () => {
      const data = await apiClient.post<unknown>(`/approvals/${id}/approve`);
      return approvalResponseSchema.parse(data);
    }, id);
  },

  /**
   * Reject an approval request with a reason.
   *
   * The payload is validated locally with `rejectRequestSchema` (min 20 chars)
   * before any network call, then the response is validated like every other
   * single-request method. A 404 surfaces as `NotFoundError`.
   */
  async rejectRequest(
    id: string,
    payload: RejectRequestInput,
  ): Promise<ApprovalResponse> {
    const parsedPayload = rejectRequestSchema.parse(payload);

    return requestWithNotFound(async () => {
      const data = await apiClient.post<unknown>(
        `/approvals/${id}/reject`,
        parsedPayload,
      );
      return approvalResponseSchema.parse(data);
    }, id);
  },
};
