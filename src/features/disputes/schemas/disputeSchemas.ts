import { z } from 'zod';

export const disputeFormSchema = z.object({
  reason: z.enum(['pet_condition', 'custody_violation', 'payment_issue', 'other']),
  description: z.string().min(50, 'Please provide more detail (at least 50 characters)'),
  attachmentIds: z.array(z.string()).optional(),
});

export type DisputeFormData = z.infer<typeof disputeFormSchema>;

/**
 * Validation for a single dispute-thread comment (issue #606).
 *
 * `body` is trimmed first, then validated against the trimmed value: a
 * whitespace-only comment fails the 1-character minimum, and successful
 * parses always yield a trimmed body.
 */
export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be 2000 characters or fewer'),
});

export type CommentFormData = z.infer<typeof commentSchema>;
