import type { Dispute } from "../../types/dispute";

export function buildDispute(overrides: Partial<Dispute> = {}): Dispute {
  return {
    id: "dispute-001",
    adoptionId: "adoption-002",
    raisedBy: "user-buyer-2",
    reason: "misrepresentation",
    description: "Pet's health condition was not accurately described in the listing.",
    status: "open",
    isOverdue: true,
    pet: { id: "pet-1", name: "Max" },
    adopter: { id: "user-buyer-2", name: "Alice Smith" },
    shelter: { id: "user-shelter-1", name: "Happy Paws Shelter" },
    evidence: [],
    timeline: [],
    resolution: null,
    createdAt: "2026-03-23T10:45:00.000Z",
    updatedAt: "2026-03-25T10:45:00.000Z",
    ...overrides,
  };
}
