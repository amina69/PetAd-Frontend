export interface ProfileInput {
  displayName: string;
  email: string;
  phone?: string;
}

export interface ProfileValidation {
  ok: boolean;
  errors: {
    displayName?: string;
    email?: string;
    phone?: string;
  };
}

export function validateProfile(input: ProfileInput): ProfileValidation {
  const errors: ProfileValidation["errors"] = {};
  if (!input.displayName.trim()) {
    errors.displayName = "Display name is required";
  } else if (input.displayName.trim().length > 80) {
    errors.displayName = "Display name must be 80 characters or fewer";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Enter a valid email";
  }

  if (input.phone && !/^[0-9+\-() ]{7,20}$/.test(input.phone.trim())) {
    errors.phone = "Enter a valid phone number";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
