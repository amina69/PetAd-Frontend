import { describe, it, expect, vi, beforeEach } from "vitest";
import { approvalService } from "./approvalService";
import { ApiError, NotFoundError } from "../lib/api-errors";
import type { ApprovalRequest } from "../types/approval";

// Mock the apiClient module
vi.mock("../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from "../lib/api-client";

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

const mockApproval: ApprovalRequest = {
  id: "approval-1",
  adopterId: "user-1",
  petId: "pet-1",
  shelterId: "shelter-1",
  status: "PENDING",
  submittedAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

const mockApprovedApproval: ApprovalRequest = {
  ...mockApproval,
  status: "APPROVED",
  resolvedAt: "2024-01-16T10:00:00Z",
  resolvedBy: "admin-1",
};

const mockRejectionPayload = {
  reason: "Incomplete documentation",
  notes: "Please resubmit with required documents",
};

describe("approvalService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getApprovals", () => {
    it("fetches approvals with no params", async () => {
      mockGet.mockResolvedValue([mockApproval]);

      const result = await approvalService.getApprovals({});

      expect(mockGet).toHaveBeenCalledWith("/approvals");
      expect(result).toEqual([mockApproval]);
    });

    it("fetches approvals with status filter", async () => {
      mockGet.mockResolvedValue([mockApproval]);

      const result = await approvalService.getApprovals({
        status: ["PENDING"],
      });

      expect(mockGet).toHaveBeenCalledWith("/approvals?status=PENDING");
      expect(result).toEqual([mockApproval]);
    });

    it("fetches approvals with multiple status filters", async () => {
      mockGet.mockResolvedValue([mockApproval]);

      const result = await approvalService.getApprovals({
        status: ["PENDING", "APPROVED"],
      });

      expect(mockGet).toHaveBeenCalledWith(
        "/approvals?status=PENDING&status=APPROVED",
      );
      expect(result).toEqual([mockApproval]);
    });

    it("fetches approvals with all params", async () => {
      mockGet.mockResolvedValue([mockApproval]);

      const result = await approvalService.getApprovals({
        status: ["PENDING"],
        shelterId: "shelter-1",
        petId: "pet-1",
        adopterId: "user-1",
        limit: 10,
        offset: 0,
      });

      expect(mockGet).toHaveBeenCalledWith(
        "/approvals?status=PENDING&shelterId=shelter-1&petId=pet-1&adopterId=user-1&limit=10&offset=0",
      );
      expect(result).toEqual([mockApproval]);
    });

    it("validates response with zod schema", async () => {
      // Return invalid data that should fail schema validation
      mockGet.mockResolvedValue({ invalid: "data" });

      await expect(approvalService.getApprovals({})).rejects.toThrow();
    });
  });

  describe("getApprovalById", () => {
    it("fetches an approval by id", async () => {
      mockGet.mockResolvedValue(mockApproval);

      const result = await approvalService.getApprovalById("approval-1");

      expect(mockGet).toHaveBeenCalledWith("/approvals/approval-1");
      expect(result).toEqual(mockApproval);
    });

    it("throws NotFoundError for 404 response", async () => {
      const notFoundError = new ApiError("Not found", {
        status: 404,
        code: "NOT_FOUND",
      });
      mockGet.mockRejectedValue(notFoundError);

      await expect(
        approvalService.getApprovalById("nonexistent"),
      ).rejects.toThrow(NotFoundError);
    });

    it("includes helpful message in NotFoundError", async () => {
      const notFoundError = new ApiError("Not found", {
        status: 404,
        code: "NOT_FOUND",
      });
      mockGet.mockRejectedValue(notFoundError);

      try {
        await approvalService.getApprovalById("nonexistent");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).message).toBe(
          "This request is no longer available. It may have been deleted or expired.",
        );
      }
    });

    it("re-throws non-404 errors", async () => {
      const serverError = new ApiError("Server error", { status: 500 });
      mockGet.mockRejectedValue(serverError);

      await expect(
        approvalService.getApprovalById("approval-1"),
      ).rejects.toThrow(serverError);
    });

    it("validates response with zod schema", async () => {
      // Return invalid data that should fail schema validation
      mockGet.mockResolvedValue({ missing: "fields" });

      await expect(approvalService.getApprovalById("approval-1")).rejects.toThrow();
    });
  });

  describe("approveRequest", () => {
    it("sends approve request and returns parsed approval", async () => {
      mockPost.mockResolvedValue(mockApprovedApproval);

      const result = await approvalService.approveRequest("approval-1");

      expect(mockPost).toHaveBeenCalledWith("/approvals/approval-1/approve");
      expect(result).toEqual(mockApprovedApproval);
      expect(result.status).toBe("APPROVED");
    });

    it("validates response with zod schema", async () => {
      mockPost.mockResolvedValue({ invalid: "response" });

      await expect(approvalService.approveRequest("approval-1")).rejects.toThrow();
    });
  });

  describe("rejectRequest", () => {
    it("sends reject request with payload and returns parsed approval", async () => {
      const mockRejected = {
        ...mockApproval,
        status: "REJECTED" as const,
        reason: mockRejectionPayload.reason,
        notes: mockRejectionPayload.notes,
      };
      mockPost.mockResolvedValue(mockRejected);

      const result = await approvalService.rejectRequest(
        "approval-1",
        mockRejectionPayload,
      );

      expect(mockPost).toHaveBeenCalledWith(
        "/approvals/approval-1/reject",
        mockRejectionPayload,
      );
      expect(result).toEqual(mockRejected);
      expect(result.status).toBe("REJECTED");
      expect(result.reason).toBe("Incomplete documentation");
    });

    it("validates response with zod schema", async () => {
      mockPost.mockResolvedValue({ invalid: "response" });

      await expect(
        approvalService.rejectRequest("approval-1", mockRejectionPayload),
      ).rejects.toThrow();
    });
  });
});
