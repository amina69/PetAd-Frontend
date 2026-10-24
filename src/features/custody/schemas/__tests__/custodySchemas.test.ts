import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CUSTODY_VALIDATION_MESSAGES,
  MAX_CUSTODY_DURATION_DAYS,
  MAX_CUSTODY_NOTES_LENGTH,
  custodyArrangementSchema,
  custodyRequestSchema,
  custodyStatusSchema,
} from "../custodySchemas";
import { CUSTODY_STATUSES } from "../../types/custody";

// Fixed "today" so date-relative rules are deterministic.
const NOW = new Date(2026, 5, 15, 12, 0, 0); // 15 June 2026, local noon

function messagesFor(input: unknown, field: string): string[] {
  const result = custodyRequestSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

const validRequest = {
  petId: "pet-1",
  caretakerId: "user-2",
  startDate: "2026-06-20",
  endDate: "2026-06-27",
  notes: "Feeds twice a day.",
};

describe("custodyRequestSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a valid request", () => {
    expect(custodyRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("accepts a request without notes", () => {
    const withoutNotes: Partial<typeof validRequest> = { ...validRequest };
    delete withoutNotes.notes;
    expect(custodyRequestSchema.safeParse(withoutNotes).success).toBe(true);
  });

  it("accepts a start date of today", () => {
    expect(
      custodyRequestSchema.safeParse({ ...validRequest, startDate: "2026-06-15" }).success,
    ).toBe(true);
  });

  it("accepts full ISO date-time strings", () => {
    const result = custodyRequestSchema.safeParse({
      ...validRequest,
      startDate: new Date(2026, 5, 16, 9).toISOString(),
      endDate: new Date(2026, 5, 18, 9).toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a start date in the past with a specific message", () => {
    expect(messagesFor({ ...validRequest, startDate: "2026-06-14" }, "startDate")).toEqual([
      CUSTODY_VALIDATION_MESSAGES.startInPast,
    ]);
  });

  it("rejects an end date before the start date with a specific message", () => {
    expect(messagesFor({ ...validRequest, endDate: "2026-06-19" }, "endDate")).toEqual([
      CUSTODY_VALIDATION_MESSAGES.endBeforeStart,
    ]);
  });

  it("rejects an end date equal to the start date", () => {
    expect(messagesFor({ ...validRequest, endDate: "2026-06-20" }, "endDate")).toEqual([
      CUSTODY_VALIDATION_MESSAGES.endBeforeStart,
    ]);
  });

  it(`accepts exactly ${MAX_CUSTODY_DURATION_DAYS} days`, () => {
    const end = new Date(2026, 5, 20 + MAX_CUSTODY_DURATION_DAYS);
    const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    expect(custodyRequestSchema.safeParse({ ...validRequest, endDate }).success).toBe(true);
  });

  it(`rejects more than ${MAX_CUSTODY_DURATION_DAYS} days`, () => {
    const end = new Date(2026, 5, 21 + MAX_CUSTODY_DURATION_DAYS);
    const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    expect(messagesFor({ ...validRequest, endDate }, "endDate")).toEqual([
      CUSTODY_VALIDATION_MESSAGES.tooLong,
    ]);
  });

  it("reports both a past start and an inverted range together", () => {
    const result = custodyRequestSchema.safeParse({
      ...validRequest,
      startDate: "2026-06-10",
      endDate: "2026-06-01",
    });
    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((i) => i.message);
    expect(messages).toContain(CUSTODY_VALIDATION_MESSAGES.startInPast);
    expect(messages).toContain(CUSTODY_VALIDATION_MESSAGES.endBeforeStart);
  });

  it("rejects malformed dates without running range checks", () => {
    expect(messagesFor({ ...validRequest, startDate: "not-a-date" }, "startDate")).toEqual([
      CUSTODY_VALIDATION_MESSAGES.invalidDate,
    ]);
    expect(messagesFor({ ...validRequest, startDate: "not-a-date" }, "endDate")).toEqual([]);
  });

  it(`rejects notes longer than ${MAX_CUSTODY_NOTES_LENGTH} characters`, () => {
    expect(
      messagesFor({ ...validRequest, notes: "a".repeat(MAX_CUSTODY_NOTES_LENGTH + 1) }, "notes"),
    ).toEqual([CUSTODY_VALIDATION_MESSAGES.notesTooLong]);
    expect(
      custodyRequestSchema.safeParse({
        ...validRequest,
        notes: "a".repeat(MAX_CUSTODY_NOTES_LENGTH),
      }).success,
    ).toBe(true);
  });

  it("requires petId and caretakerId", () => {
    expect(messagesFor({ ...validRequest, petId: "" }, "petId")).toEqual(["Select a pet"]);
    expect(messagesFor({ ...validRequest, caretakerId: "" }, "caretakerId")).toEqual([
      "Select a caretaker",
    ]);
  });
});

describe("custodyStatusSchema", () => {
  it.each(CUSTODY_STATUSES)("accepts %s", (status) => {
    expect(custodyStatusSchema.safeParse(status).success).toBe(true);
  });

  it("rejects unknown statuses", () => {
    expect(custodyStatusSchema.safeParse("ACTIVE").success).toBe(false);
  });
});

describe("custodyArrangementSchema", () => {
  const arrangement = {
    id: "custody-1",
    petId: "pet-1",
    ownerId: "user-1",
    caretakerId: "user-2",
    startDate: "2026-06-20T00:00:00.000Z",
    endDate: "2026-06-27T00:00:00.000Z",
    status: "active",
    notes: null,
    escrowStatus: "FUNDED",
  };

  it("parses an arrangement from the API", () => {
    expect(custodyArrangementSchema.parse(arrangement)).toEqual(arrangement);
  });

  it("allows a missing escrow (null)", () => {
    expect(
      custodyArrangementSchema.safeParse({ ...arrangement, escrowStatus: null }).success,
    ).toBe(true);
  });

  it("rejects escrow statuses outside the escrow record vocabulary", () => {
    expect(
      custodyArrangementSchema.safeParse({ ...arrangement, escrowStatus: "SETTLED" }).success,
    ).toBe(false);
  });
});
