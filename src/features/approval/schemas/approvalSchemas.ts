import { z } from "zod";

/**
 * A single approval decision in the history of an adoption request.
 *
 * Mirrors the `ApprovalDecision` interface (src/types/adoption.ts) as the
 * single source of truth for runtime validation of approval API responses.
 */
export const approvalResponseSchema = z.object({
  id: z.string(),
  approverName: z.string(),
  approverRole: z.string(),
  status: z.enum(["APPROVED", "REJECTED", "EXPIRED"]),
  reason: z.string().optional(),
  timestamp: z.string(),
  txHash: z.string().optional(),
});

/**
 * A single approval decision in the history of an adoption request.
 */
export type ApprovalResponse = z.infer<typeof approvalResponseSchema>;

/**
 * Payload sent when rejecting an adoption request. The rejection reason must
 * be at least 20 characters so the reviewer provides a meaningful explanation.
 */
export const rejectRequestSchema = z.object({
  reason: z
    .string()
    .min(20, "Please provide at least 20 characters explaining the rejection"),
});

/**
 * Payload sent when rejecting an adoption request.
 */
export type RejectRequest = z.infer<typeof rejectRequestSchema>;

/**
 * A single item in the admin approval queue.
 *
 * Mirrors the `AdminApprovalQueueItem` interface (src/types/adoption.ts) as the
 * single source of truth for runtime validation of the admin queue response.
 */
export const adminApprovalQueueItemSchema = z.object({
  id: z.string(),
  shelter: z.string(),
  pet: z.string(),
  adopter: z.string(),
  submitted: z.string(),
  shelterApproved: z.boolean(),
  daysWaiting: z.number(),
  isOverdue: z.boolean(),
});

/**
 * A single item in the admin approval queue.
 */
export type AdminApprovalQueueItem = z.infer<
  typeof adminApprovalQueueItemSchema
>;

/**
 * Response envelope returned by the admin approval queue endpoint.
 */
export const adminApprovalQueueResponseSchema = z.object({
  items: z.array(adminApprovalQueueItemSchema),
  nextCursor: z.string().nullable().optional(),
});

/**
 * Response envelope returned by the admin approval queue endpoint.
 */
export type AdminApprovalQueueResponse = z.infer<
  typeof adminApprovalQueueResponseSchema
>;