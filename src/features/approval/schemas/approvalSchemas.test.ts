import { describe, it, expect } from "vitest";
import {
  adminApprovalQueueResponseSchema,
  approvalResponseSchema,
  rejectRequestSchema,
} from "./approvalSchemas";

describe("rejectRequestSchema", () => {
  const validReason =
    "This is a valid rejection reason with enough characters";

  it("rejects a reason shorter than 20 characters with the expected message", () => {
    const result = rejectRequestSchema.safeParse({ reason: "too short" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(Error);
      const issue = result.error.issues[0];
      expect(issue.path).toEqual(["reason"]);
      expect(issue.message).toBe(
        "Please provide at least 20 characters explaining the rejection",
      );
    }
  });

  it("accepts a reason of at least 20 characters", () => {
    expect(
      rejectRequestSchema.safeParse({ reason: validReason }).success,
    ).toBe(true);
  });

  it("rejects a missing reason field", () => {
    const result = rejectRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["reason"]);
    }
  });
});

describe("approvalResponseSchema", () => {
  const baseApproval = {
    id: "dec-1",
    approverName: "Dr. Sarah Lee",
    approverRole: "Veterinary Inspector",
    status: "APPROVED",
    timestamp: "2026-01-01T00:00:00.000Z",
  };

  it("parses a valid approval decision without optional fields", () => {
    expect(approvalResponseSchema.safeParse(baseApproval).success).toBe(true);
  });

  it("parses a valid approval decision with optional fields", () => {
    expect(
      approvalResponseSchema.safeParse({
        ...baseApproval,
        reason: "Health check passed",
        txHash: "0xabc",
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(
      approvalResponseSchema.safeParse({ ...baseApproval, status: "PENDING" })
        .success,
    ).toBe(false);
  });

  it("rejects null for optional fields (optional means undefined, not null)", () => {
    expect(
      approvalResponseSchema.safeParse({ ...baseApproval, reason: null })
        .success,
    ).toBe(false);
    expect(
      approvalResponseSchema.safeParse({ ...baseApproval, txHash: null })
        .success,
    ).toBe(false);
  });

  it("rejects a missing required field", () => {
    const missingId = { ...baseApproval };
    Reflect.deleteProperty(missingId, "id");
    expect(approvalResponseSchema.safeParse(missingId).success).toBe(false);
  });
});

describe("adminApprovalQueueResponseSchema", () => {
  const queueItem = {
    id: "adoption-101",
    shelter: "Happy Paws Shelter",
    pet: "Buddy (Golden Retriever)",
    adopter: "John Doe",
    submitted: "2026-01-01T00:00:00.000Z",
    shelterApproved: true,
    daysWaiting: 4,
    isOverdue: true,
  };

  it("parses a valid queue response with a null nextCursor", () => {
    expect(
      adminApprovalQueueResponseSchema.safeParse({
        items: [queueItem],
        nextCursor: null,
      }).success,
    ).toBe(true);
  });

  it("accepts a missing nextCursor", () => {
    expect(
      adminApprovalQueueResponseSchema.safeParse({ items: [queueItem] })
        .success,
    ).toBe(true);
  });

  it("rejects an invalid queue item", () => {
    expect(
      adminApprovalQueueResponseSchema.safeParse({
        items: [{ ...queueItem, daysWaiting: "4" }],
      }).success,
    ).toBe(false);
  });
});
