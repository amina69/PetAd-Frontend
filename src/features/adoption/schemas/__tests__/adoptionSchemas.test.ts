import { describe, it, expect } from 'vitest';
import { adoptionFormSchema } from '../adoptionSchemas';

const validApplication = {
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  reason: 'A'.repeat(50),
};

describe('adoptionFormSchema', () => {
  it('accepts a valid application', () => {
    const result = adoptionFormSchema.safeParse(validApplication);
    expect(result.success).toBe(true);
  });

  it('rejects a name shorter than 2 characters with the README message', () => {
    const result = adoptionFormSchema.safeParse({ ...validApplication, fullName: 'J' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Name must be at least 2 characters',
      );
    }
  });

  it('rejects an invalid email with the README message', () => {
    const result = adoptionFormSchema.safeParse({
      ...validApplication,
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });

  it('rejects a phone number that is not E.164-style with the README message', () => {
    const result = adoptionFormSchema.safeParse({
      ...validApplication,
      phone: '01234567890',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid phone number');
    }
  });

  it('rejects a reason shorter than 50 characters with the README message', () => {
    const result = adoptionFormSchema.safeParse({ ...validApplication, reason: 'Too short' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Please provide more details');
    }
  });

  it.each(['+1234567890', '1234567890', '+2348012345678'])(
    'accepts the E.164-style phone number "%s"',
    (phone) => {
      const result = adoptionFormSchema.safeParse({ ...validApplication, phone });
      expect(result.success).toBe(true);
    },
  );

  it.each(['', '0123456789', '+0123456789', 'not-a-phone', '+1234567890123456'])(
    'rejects the phone number "%s"',
    (phone) => {
      const result = adoptionFormSchema.safeParse({ ...validApplication, phone });
      expect(result.success).toBe(false);
    },
  );
});
