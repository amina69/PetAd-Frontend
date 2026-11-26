import { z } from 'zod';

/**
 * Adoption application form schema.
 *
 * The rules below are the ones documented in the README validation example,
 * with the exact user-facing messages the README specifies:
 * - fullName: at least 2 characters
 * - email: valid email address
 * - phone: E.164-style number
 * - reason: at least 50 characters
 */
export const adoptionFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  reason: z.string().min(50, 'Please provide more details'),
});

export type AdoptionFormData = z.infer<typeof adoptionFormSchema>;

export type AdoptionFormField = keyof AdoptionFormData;

/**
 * Per-field schemas, so a single field can be validated on its own (for
 * example on blur) without parsing - and reporting errors for - the sibling
 * fields of the form.
 */
export const adoptionFieldSchemas = adoptionFormSchema.shape;
