import { describe, it, expect, beforeEach, vi } from "vitest";
import { petAvailabilityService, computeAvailability } from "./petService";
import type { AdoptionDetails, CustodyDetails } from "../types/adoption";

const getMock = vi.fn();

vi.mock("../lib/api-client", () => ({
  apiClient: {
    get: getMock,
  },
}));

describe("PetAvailabilityService", () => {
  beforeEach(() => {
    getMock.mockReset();
    petAvailabilityService.clearEventLog();
  });

  it("computes ADOPTED when the latest adoption is COMPLETED", async () => {
    const adoption: AdoptionDetails = {
      id: "adoption-1",
      status: "COMPLETED",
      petId: "pet-1",
      adopterId: "user-1",
      createdAt: "2026-03-25T10:00:00Z",
      updatedAt: "2026-03-25T11:00:00Z",
    };

    const custody: CustodyDetails = {
      id: "custody-1",
      status: "ACTIVE",
      petId: "pet-1",
      custodianId: "user-2",
      ownerId: "user-3",
      startDate: "2026-03-25T10:00:00Z",
      createdAt: "2026-03-25T10:00:00Z",
      updatedAt: "2026-03-25T10:00:00Z",
    };

    getMock.mockResolvedValueOnce(adoption).mockResolvedValueOnce(custody);

    const availability = await petAvailabilityService.resolve("pet-1");

    expect(availability).toBe("ADOPTED");
    expect(petAvailabilityService.getEventLog("pet-1")).toHaveLength(1);
    expect(petAvailabilityService.getEventLog("pet-1")[0]).toMatchObject({
      previousAvailability: null,
      newAvailability: "ADOPTED",
      source: "adoption",
    });
  });

  it("computes IN_CUSTODY when custody is ACTIVE and adoption is not completed", async () => {
    const adoption: AdoptionDetails = {
      id: "adoption-2",
      status: "APPROVED",
      petId: "pet-2",
      adopterId: "user-4",
      createdAt: "2026-03-26T10:00:00Z",
      updatedAt: "2026-03-26T11:00:00Z",
    };

    const custody: CustodyDetails = {
      id: "custody-2",
      status: "ACTIVE",
      petId: "pet-2",
      custodianId: "user-5",
      ownerId: "user-6",
      startDate: "2026-03-26T10:00:00Z",
      createdAt: "2026-03-26T10:00:00Z",
      updatedAt: "2026-03-26T10:00:00Z",
    };

    getMock.mockResolvedValueOnce(adoption).mockResolvedValueOnce(custody);

    const availability = await petAvailabilityService.resolve("pet-2");

    expect(availability).toBe("IN_CUSTODY");
    expect(petAvailabilityService.getEventLog("pet-2")).toHaveLength(1);
    expect(petAvailabilityService.getEventLog("pet-2")[0]).toMatchObject({
      newAvailability: "IN_CUSTODY",
      source: "custody",
    });
  });

  it("computes PENDING when adoption status is pending and there is no active custody", async () => {
    const adoption: AdoptionDetails = {
      id: "adoption-3",
      status: "ESCROW_FUNDED",
      petId: "pet-3",
      adopterId: "user-7",
      createdAt: "2026-03-27T10:00:00Z",
      updatedAt: "2026-03-27T11:00:00Z",
    };

    getMock.mockResolvedValueOnce(adoption).mockResolvedValueOnce(null);

    const availability = await petAvailabilityService.resolve("pet-3");

    expect(availability).toBe("PENDING");
    expect(petAvailabilityService.getEventLog("pet-3")).toHaveLength(1);
  });

  it("computes AVAILABLE when there is no adoption or active custody", async () => {
    getMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const availability = await petAvailabilityService.resolve("pet-4");

    expect(availability).toBe("AVAILABLE");
    expect(petAvailabilityService.getEventLog("pet-4")).toHaveLength(1);
  });

  it("does not create a duplicate event when availability stays the same", async () => {
    const adoption: AdoptionDetails = {
      id: "adoption-5",
      status: "ESCROW_FUNDED",
      petId: "pet-5",
      adopterId: "user-8",
      createdAt: "2026-03-28T10:00:00Z",
      updatedAt: "2026-03-28T11:00:00Z",
    };

    getMock.mockResolvedValueOnce(adoption).mockResolvedValueOnce(null);
    await petAvailabilityService.resolve("pet-5");
    getMock.mockResolvedValueOnce(adoption).mockResolvedValueOnce(null);
    await petAvailabilityService.resolve("pet-5");

    expect(petAvailabilityService.getEventLog("pet-5")).toHaveLength(1);
  });
});

describe("computeAvailability", () => {
  it("returns AVAILABLE when no adoption and no custody data present", () => {
    expect(computeAvailability(null, null)).toBe("AVAILABLE");
  });

  it("returns PENDING for a pending adoption status", () => {
    const adoption: AdoptionDetails = {
      id: "adoption-6",
      status: "APPROVED",
      petId: "pet-6",
      adopterId: "user-9",
      createdAt: "2026-03-29T10:00:00Z",
      updatedAt: "2026-03-29T11:00:00Z",
    };

    expect(computeAvailability(adoption, null)).toBe("PENDING");
  });
});
