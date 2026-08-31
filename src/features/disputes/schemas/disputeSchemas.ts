import { z } from 'zod';

export const disputeFormSchema = z.object({
  reason: z.enum(['pet_condition', 'custody_violation', 'payment_issue', 'other']),
  description: z.string().min(50, 'Please provide more detail (at least 50 characters)'),
  attachmentIds: z.array(z.string()).optional(),
});

export type DisputeFormData = z.infer<typeof disputeFormSchema>;
