import { describe, it, expect, vi, beforeEach } from "vitest";
import { approvalService } from "../approvalService";

// Mock the API client
vi.mock("../../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../lib/api-client";

describe("approvalService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call apiClient.get with correct endpoint", async () => {
    const mockResponse = {
      data: [],
      total: 0,
      limit: 0,
      offset: 0,
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    await approvalService.getPendingApprovals();

    expect(apiClient.get).toHaveBeenCalledWith(
      "/shelter/approvals?status=PENDING&limit=0",
    );
  });

  it("should return approval response data", async () => {
    const mockResponse = {
      data: [
        {
          id: "1",
          status: "PENDING" as const,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "2",
          status: "PENDING" as const,
          createdAt: "2026-01-02",
          updatedAt: "2026-01-02",
        },
      ],
      total: 2,
      limit: 0,
      offset: 0,
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    const result = await approvalService.getPendingApprovals();

    expect(result).toEqual(mockResponse);
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it("should handle empty approval list", async () => {
    const mockResponse = {
      data: [],
      total: 0,
      limit: 0,
      offset: 0,
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    const result = await approvalService.getPendingApprovals();

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("should handle API errors", async () => {
    const error = new Error("API Error");
    (apiClient.get as any).mockRejectedValue(error);

    await expect(approvalService.getPendingApprovals()).rejects.toThrow(
      "API Error",
    );
  });

  it("should include all required fields in response", async () => {
    const mockResponse = {
      data: [
        {
          id: "approval-123",
          status: "PENDING" as const,
          createdAt: "2026-01-01T10:00:00Z",
          updatedAt: "2026-01-01T10:00:00Z",
        },
      ],
      total: 1,
      limit: 0,
      offset: 0,
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    const result = await approvalService.getPendingApprovals();

    expect(result.data[0]).toHaveProperty("id");
    expect(result.data[0]).toHaveProperty("status");
    expect(result.data[0]).toHaveProperty("createdAt");
    expect(result.data[0]).toHaveProperty("updatedAt");
  });
});
