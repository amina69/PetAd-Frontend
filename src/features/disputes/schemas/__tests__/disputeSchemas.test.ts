import { describe, it, expect } from 'vitest';
import { disputeFormSchema } from '../disputeSchemas';

const validDispute = {
  reason: 'pet_condition',
  description: 'The pet arrived with a health condition that was not disclosed in the adoption listing.',
};

describe('disputeFormSchema', () => {
  it('accepts a valid dispute submission', () => {
    const result = disputeFormSchema.safeParse(validDispute);
    expect(result.success).toBe(true);
  });

  it('rejects a description under 50 characters with the exact message', () => {
    const result = disputeFormSchema.safeParse({
      ...validDispute,
      description: 'Too short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Please provide more detail (at least 50 characters)',
      );
    }
  });

  it('accepts a description of exactly 50 characters', () => {
    const result = disputeFormSchema.safeParse({
      ...validDispute,
      description: 'a'.repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it.each(['pet_condition', 'custody_violation', 'payment_issue', 'other'])(
    'accepts reason "%s"',
    (reason) => {
      const result = disputeFormSchema.safeParse({ ...validDispute, reason });
      expect(result.success).toBe(true);
    },
  );

  it('rejects an unknown reason', () => {
    const result = disputeFormSchema.safeParse({
      ...validDispute,
      reason: 'unknown_reason',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a submission without attachmentIds', () => {
    const result = disputeFormSchema.safeParse(validDispute);
    expect(result.success).toBe(true);
  });

  it('accepts attachmentIds as an array of strings', () => {
    const result = disputeFormSchema.safeParse({
      ...validDispute,
      attachmentIds: ['file-1', 'file-2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-string entries in attachmentIds', () => {
    const result = disputeFormSchema.safeParse({
      ...validDispute,
      attachmentIds: ['file-1', 42],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing reason', () => {
    const result = disputeFormSchema.safeParse({ description: validDispute.description });
    expect(result.success).toBe(false);
  });
});
