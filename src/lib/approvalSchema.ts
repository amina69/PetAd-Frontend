import { z } from "zod";

export const approvalRequestSchema = z.object({
  id: z.string(),
  adopterId: z.string(),
  petId: z.string(),
  shelterId: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]),
  submittedAt: z.string(),
  updatedAt: z.string(),
  resolvedAt: z.string().optional(),
  resolvedBy: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type ApprovalRequestResponse = z.infer<typeof approvalRequestSchema>;

export const approvalListResponseSchema = z.array(approvalRequestSchema);
