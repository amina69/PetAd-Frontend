import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../../../lib/api-client";
import { ApiError, NotFoundError } from "../../../../lib/api-errors";
import { approvalService } from "../approvalService";

vi.mock("../../../../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const validApproval = {
  id: "app-1",
  approverName: "Dr. Sarah Lee",
  approverRole: "Veterinary Inspector",
  status: "APPROVED" as const,
  timestamp: "2026-01-01T00:00:00.000Z",
};

const validReason =
  "The applicant did not provide the required vaccination records in time.";

describe("approvalService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── getApprovals ──────────────────────────────────────────────────────────

  it("builds the query string for the approvals list", async () => {
    mockApiClient.get.mockResolvedValue({ items: [], total: 0 });

    const result = await approvalService.getApprovals({
      status: "PENDING",
      page: 2,
      limit: 10,
    });

    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    expect(mockApiClient.get).toHaveBeenCalledWith(
      "/approvals?status=PENDING&page=2&limit=10",
    );
    expect(result).toEqual({ items: [], total: 0 });
  });

  it("omits the query string when no params are supplied", async () => {
    mockApiClient.get.mockResolvedValue({ items: [] });

    await approvalService.getApprovals();

    expect(mockApiClient.get).toHaveBeenCalledWith("/approvals");
  });

  // ── getApprovalById ───────────────────────────────────────────────────────

  it("fetches a single approval and validates it through approvalResponseSchema", async () => {
    mockApiClient.get.mockResolvedValue(validApproval);

    const result = await approvalService.getApprovalById("app-1");

    expect(mockApiClient.get).toHaveBeenCalledWith("/approvals/app-1");
    expect(result).toEqual(validApproval);
  });

  it("rejects when the response does not match approvalResponseSchema", async () => {
    mockApiClient.get.mockResolvedValue({ id: "app-1", status: "PENDING" });

    await expect(approvalService.getApprovalById("app-1")).rejects.toThrow();
  });

  it("wraps a 404 response in a NotFoundError the UI can branch on", async () => {
    mockApiClient.get.mockRejectedValue(
      new ApiError("Request failed with status 404", {
        status: 404,
        code: "NOT_FOUND",
      }),
    );

    const error: unknown = await approvalService
      .getApprovalById("expired-1")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as NotFoundError).status).toBe(404);
    expect((error as NotFoundError).message).toContain("no longer available");
  });

  it("re-throws non-404 errors unchanged", async () => {
    const serverError = new ApiError("Boom", { status: 500 });
    mockApiClient.get.mockRejectedValue(serverError);

    await expect(approvalService.getApprovalById("app-1")).rejects.toBe(
      serverError,
    );
  });

  // ── approveRequest ────────────────────────────────────────────────────────

  it("approves a request and validates the response", async () => {
    mockApiClient.post.mockResolvedValue(validApproval);

    const result = await approvalService.approveRequest("app-1");

    expect(mockApiClient.post).toHaveBeenCalledWith("/approvals/app-1/approve");
    expect(result.status).toBe("APPROVED");
  });

  it("maps a 404 on approve to a NotFoundError", async () => {
    mockApiClient.post.mockRejectedValue(new ApiError("Gone", { status: 404 }));

    await expect(approvalService.approveRequest("app-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  // ── rejectRequest ─────────────────────────────────────────────────────────

  it("posts the validated rejection payload", async () => {
    mockApiClient.post.mockResolvedValue({ ...validApproval, status: "REJECTED" });

    const result = await approvalService.rejectRequest("app-1", {
      reason: validReason,
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/approvals/app-1/reject",
      { reason: validReason },
    );
    expect(result.status).toBe("REJECTED");
  });

  it("rejects an invalid reason before any network call", async () => {
    await expect(
      approvalService.rejectRequest("app-1", { reason: "too short" }),
    ).rejects.toThrow(
      "Please provide at least 20 characters explaining the rejection",
    );

    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it("maps a 404 on reject to a NotFoundError", async () => {
    mockApiClient.post.mockRejectedValue(new ApiError("Gone", { status: 404 }));

    await expect(
      approvalService.rejectRequest("app-1", { reason: validReason }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
