import { z } from "zod";

export const resolutionNoteSchema = z
  .string()
  .trim()
  .min(20, "Resolution note must be at least 20 characters")
  .max(2000, "Resolution note must be 2000 characters or fewer");

export const disputeModerationSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "RESOLVED"]),
  resolutionNote: resolutionNoteSchema,
  assignedAdminId: z.string().trim().optional(),
});

export type DisputeModerationInput = z.infer<typeof disputeModerationSchema>;
