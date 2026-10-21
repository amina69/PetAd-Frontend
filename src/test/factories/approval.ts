import type { ApprovalItem } from "../../features/approval/types/approval.types";

export function buildApproval(overrides: Partial<ApprovalItem> = {}): ApprovalItem {
  return {
    id: "app-1",
    adoptionId: "adopt-101",
    petName: "Buddy",
    applicantName: "John Doe",
    status: "PENDING",
    role: "veterinarian",
    submittedAt: "2026-06-01T10:00:00Z",
    ...overrides,
  };
}
