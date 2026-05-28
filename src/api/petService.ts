import { apiClient } from "../lib/api-client";
import type { AdoptionDetails, CustodyDetails } from "../types/adoption";
import type { PetAvailability, PetAvailabilityEvent } from "../types/pet";

const PENDING_ADOPTION_STATUSES = new Set([
  "REQUESTED",
  "PENDING_REVIEW",
  "APPROVED",
  "ESCROW_FUNDED",
] as const);

function computeAvailability(
  adoption: AdoptionDetails | null,
  custody: CustodyDetails | null,
): PetAvailability {
  if (adoption?.status === "COMPLETED") {
    return "ADOPTED";
  }

  if (custody?.status === "ACTIVE") {
    return "IN_CUSTODY";
  }

  if (adoption?.status && PENDING_ADOPTION_STATUSES.has(adoption.status as typeof PENDING_ADOPTION_STATUSES extends Set<infer T> ? T : never)) {
    return "PENDING";
  }

  return "AVAILABLE";
}

function getResolutionSource(
  availability: PetAvailability,
): PetAvailabilityEvent["source"] {
  if (availability === "ADOPTED") return "adoption";
  if (availability === "IN_CUSTODY") return "custody";
  return "computed";
}

function getChangeReason(
  newAvailability: PetAvailability,
  adoption: AdoptionDetails | null,
  custody: CustodyDetails | null,
): string {
  if (newAvailability === "ADOPTED") {
    return `Latest adoption status is ${adoption?.status ?? "COMPLETED"}.`;
  }

  if (newAvailability === "IN_CUSTODY") {
    return `Active custody record is ${custody?.status ?? "ACTIVE"}.`;
  }

  if (newAvailability === "PENDING") {
    return `Latest adoption status is ${adoption?.status}.`;
  }

  return "No active adoption or custody records found.";
}

function makeEventId(petId: string): string {
  return `${petId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class PetAvailabilityService {
  private lastAvailability = new Map<string, PetAvailability>();
  private events: PetAvailabilityEvent[] = [];

  async resolve(petId: string): Promise<PetAvailability> {
    const [latestAdoption, activeCustody] = await Promise.all([
      this.getLatestAdoptionForPet(petId),
      this.getActiveCustodyForPet(petId),
    ]);

    const newAvailability = computeAvailability(latestAdoption, activeCustody);
    const previousAvailability = this.lastAvailability.get(petId) ?? null;

    if (previousAvailability !== newAvailability) {
      this.lastAvailability.set(petId, newAvailability);
      this.events.push({
        id: makeEventId(petId),
        petId,
        previousAvailability,
        newAvailability,
        source: getResolutionSource(newAvailability),
        reason: getChangeReason(newAvailability, latestAdoption, activeCustody),
        timestamp: new Date().toISOString(),
      });
    }

    return newAvailability;
  }

  async getLatestAdoptionForPet(petId: string): Promise<AdoptionDetails | null> {
    return apiClient.get<AdoptionDetails | null>(
      `/adoption/latest?petId=${encodeURIComponent(petId)}`,
    );
  }

  async getActiveCustodyForPet(petId: string): Promise<CustodyDetails | null> {
    return apiClient.get<CustodyDetails | null>(
      `/custody/active?petId=${encodeURIComponent(petId)}`,
    );
  }

  getEventLog(petId: string): PetAvailabilityEvent[] {
    return this.events.filter((event) => event.petId === petId);
  }

  clearEventLog(): void {
    this.lastAvailability.clear();
    this.events = [];
  }
}

export const petAvailabilityService = new PetAvailabilityService();
export { computeAvailability };
