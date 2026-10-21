import { apiClient } from "../lib/api-client";
import { ApiError, ForbiddenError } from "../lib/api-errors";
import type { CustodyDetails, AdoptionStatus } from "../types/adoption";
import type { CustodyArrangement, CustodyStatus } from "../features/custody/types";
import {
  custodyArrangementSchema,
  custodyAvailabilitySchema,
  custodyListResponseSchema,
  custodyRequestSchema,
  type CustodyAvailability,
  type CustodyListResponse,
  type CustodyRequest,
} from "../features/custody/schemas/custodySchemas";

export interface CustodyTimelineEvent {
  type: string;
  label: string;
  timestamp: string;
  stellarExplorerUrl?: string;
  fromStatus?: AdoptionStatus;
  toStatus?: AdoptionStatus;
}

export interface CustodyListParams {
  /**
   * Status filter. A single status (`"active"`) or a list of statuses
   * (`["requested", "approved"]`), which is serialised as a comma-separated
   * value so the dashboard can ask for a whole bucket in one request.
   */
  status?: CustodyStatus | CustodyStatus[];
  petId?: string;
  page?: number;
  limit?: number;
}

/**
 * Thrown when the requested custody dates overlap an existing arrangement
 * (HTTP 409), so the UI can prompt for different dates instead of showing a
 * generic error.
 */
export class CustodyConflictError extends ApiError {
  constructor(
    message: string,
    options?: { status?: number; code?: string; data?: unknown },
  ) {
    super(message, options);
    this.name = "CustodyConflictError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Maps 409 → `CustodyConflictError` and 403 → `ForbiddenError` so callers can
 * branch with `instanceof` rather than inspecting status codes.
 */
async function withCustodyErrors<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    const options = { status: error.status, code: error.code, data: error.data };
    if (error.status === 409) {
      throw new CustodyConflictError(error.message, {
        ...options,
        code: error.code ?? "CUSTODY_DATE_CONFLICT",
      });
    }
    if (error.status === 403) {
      throw new ForbiddenError(error.message, {
        ...options,
        code: error.code ?? "CUSTODY_FORBIDDEN",
      });
    }
    throw error;
  }
}

function buildListQuery(params: CustodyListParams): string {
  const searchParams = new URLSearchParams();
  if (params.status) {
    searchParams.append(
      "status",
      Array.isArray(params.status) ? params.status.join(",") : params.status,
    );
  }
  if (params.petId) searchParams.append("petId", params.petId);
  if (params.page !== undefined) searchParams.append("page", String(params.page));
  if (params.limit !== undefined) searchParams.append("limit", String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/**
 * `custodyService` — API layer for the Temporary Custody domain.
 *
 * Every custody-arrangement response is parsed through the Zod schemas in
 * `features/custody/schemas`, so contract drift surfaces at the boundary.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/627
 */
export const custodyService = {
  async getDetails(custodyId: string): Promise<CustodyDetails> {
    return apiClient.get<CustodyDetails>(`/custody/${custodyId}`);
  },

  async getTimeline(custodyId: string): Promise<CustodyTimelineEvent[]> {
    return apiClient.get<CustodyTimelineEvent[]>(`/custody/${custodyId}/timeline`);
  },

  /** GET /custody — paginated list of custody arrangements. */
  async getCustodyList(params: CustodyListParams = {}): Promise<CustodyListResponse> {
    const response = await withCustodyErrors(() =>
      apiClient.get<unknown>(`/custody${buildListQuery(params)}`),
    );
    return custodyListResponseSchema.parse(response);
  },

  /** GET /custody/:id — a single custody arrangement. */
  async getCustodyById(id: string): Promise<CustodyArrangement> {
    const response = await withCustodyErrors(() =>
      apiClient.get<unknown>(`/custody/${encodeURIComponent(id)}`),
    );
    return custodyArrangementSchema.parse(response);
  },

  /**
   * GET /custody/availability — the days a pet cannot be placed in custody
   * for (an existing arrangement already covers them).
   *
   * The dates come back as date-only strings so the client can hand them
   * straight to the date range picker without re-interpreting them in a
   * different time zone.
   */
  async getAvailability(
    petId: string,
    params: { startDate?: string; endDate?: string } = {},
  ): Promise<CustodyAvailability> {
    const searchParams = new URLSearchParams({ petId });

    if (params.startDate) searchParams.append("startDate", params.startDate);
    if (params.endDate) searchParams.append("endDate", params.endDate);

    const response = await withCustodyErrors(() =>
      apiClient.get<unknown>(`/custody/availability?${searchParams.toString()}`),
    );

    return custodyAvailabilitySchema.parse(response);
  },

  /**
   * POST /custody — request a new custody arrangement. The payload is
   * validated client-side first; a date overlap rejects with
   * `CustodyConflictError`.
   */
  async requestCustody(payload: CustodyRequest): Promise<CustodyArrangement> {
    const body = custodyRequestSchema.parse(payload);
    const response = await withCustodyErrors(() =>
      apiClient.post<unknown>("/custody", body),
    );
    return custodyArrangementSchema.parse(response);
  },

  /** PATCH /custody/:id/extend — move the end date of an arrangement. */
  async extendCustody(id: string, newEndDate: string): Promise<CustodyArrangement> {
    const response = await withCustodyErrors(() =>
      apiClient.patch<unknown>(`/custody/${encodeURIComponent(id)}/extend`, {
        endDate: newEndDate,
      }),
    );
    return custodyArrangementSchema.parse(response);
  },

  /** POST /custody/:id/end — end an arrangement early. */
  async endCustody(id: string): Promise<CustodyArrangement> {
    const response = await withCustodyErrors(() =>
      apiClient.post<unknown>(`/custody/${encodeURIComponent(id)}/end`),
    );
    return custodyArrangementSchema.parse(response);
  },
};
