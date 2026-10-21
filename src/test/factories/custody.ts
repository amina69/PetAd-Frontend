import type { CustodyDetails } from "../../types/adoption";

export function buildCustody(overrides: Partial<CustodyDetails> = {}): CustodyDetails {
  return {
    id: "custody-1",
    status: "ACTIVE",
    petId: "pet-1",
    custodianId: "user-1",
    ownerId: "user-2",
    startDate: "2026-03-25T10:00:00Z",
    createdAt: "2026-03-25T10:00:00Z",
    updatedAt: "2026-03-25T10:10:00Z",
    ...overrides,
  };
}
