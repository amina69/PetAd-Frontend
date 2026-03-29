import { describe, it, expect, vi, beforeEach } from "vitest";
import { adoptionApprovalsService } from "../adoptionApprovalsService";

// Mock the API client
vi.mock("../../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../../lib/api-client";

describe("adoptionApprovalsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call apiClient.get with correct endpoint", async () => {
    const mockResponse = {
      required: 3,
      given: 1,
      pending: 2,
      quorumMet: false,
      escrowAccountId: "escrow-123",
      parties: [],
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    await adoptionApprovalsService.getAdoptionApprovals("adoption-123");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/adoption/adoption-123/approvals",
    );
  });

  it("should return approval state data correctly", async () => {
    const mockResponse = {
      required: 3,
      given: 1,
      pending: 2,
      quorumMet: false,
      escrowAccountId: "escrow-456",
      parties: [
        {
          id: "party-1",
          name: "Dr. Sarah Lee",
          role: "Veterinary Inspector",
          status: "APPROVED",
          timestamp: "2026-03-29T10:00:00Z",
        },
      ],
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    const result = await adoptionApprovalsService.getAdoptionApprovals(
      "adoption-123",
    );

    expect(result).toEqual(mockResponse);
    expect(result.required).toBe(3);
    expect(result.given).toBe(1);
    expect(result.pending).toBe(2);
    expect(result.quorumMet).toBe(false);
  });

  it("should handle quorum met state", async () => {
    const mockResponse = {
      required: 3,
      given: 3,
      pending: 0,
      quorumMet: true,
      escrowAccountId: "escrow-789",
      parties: [
        {
          id: "party-1",
          name: "Dr. Sarah Lee",
          role: "Veterinary Inspector",
          status: "APPROVED",
          timestamp: "2026-03-29T10:00:00Z",
        },
        {
          id: "party-2",
          name: "Mark Evans",
          role: "Welfare Officer",
          status: "APPROVED",
          timestamp: "2026-03-29T11:30:00Z",
        },
        {
          id: "party-3",
          name: "Jane Smith",
          role: "Legal Reviewer",
          status: "APPROVED",
          timestamp: "2026-03-29T12:15:00Z",
        },
      ],
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    const result = await adoptionApprovalsService.getAdoptionApprovals(
      "adoption-123",
    );

    expect(result.quorumMet).toBe(true);
    expect(result.given).toBe(result.required);
    expect(result.pending).toBe(0);
  });

  it("should handle API errors", async () => {
    const error = new Error("API Error");
    (apiClient.get as any).mockRejectedValue(error);

    await expect(
      adoptionApprovalsService.getAdoptionApprovals("adoption-123"),
    ).rejects.toThrow("API Error");
  });

  it("should include parties in response", async () => {
    const mockResponse = {
      required: 2,
      given: 1,
      pending: 1,
      quorumMet: false,
      escrowAccountId: "escrow-123",
      parties: [
        {
          id: "party-1",
          name: "Alice Smith",
          role: "Inspector",
          status: "APPROVED",
          timestamp: "2026-03-29T10:00:00Z",
        },
        {
          id: "party-2",
          name: "Bob Johnson",
          role: "Officer",
          status: "PENDING",
        },
      ],
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    const result = await adoptionApprovalsService.getAdoptionApprovals(
      "adoption-123",
    );

    expect(result.parties).toHaveLength(2);
    expect(result.parties[0].status).toBe("APPROVED");
    expect(result.parties[1].status).toBe("PENDING");
  });

  it("should handle different adoption IDs", async () => {
    const mockResponse = {
      required: 3,
      given: 2,
      pending: 1,
      quorumMet: false,
      escrowAccountId: "escrow-999",
      parties: [],
    };

    (apiClient.get as any).mockResolvedValue(mockResponse);

    await adoptionApprovalsService.getAdoptionApprovals("adoption-different");

    expect(apiClient.get).toHaveBeenCalledWith(
      "/adoption/adoption-different/approvals",
    );
  });
});
