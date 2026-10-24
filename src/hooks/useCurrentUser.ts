import { useMemo } from "react";

/**
 * useCurrentUser
 *
 * Returns the profile of the currently signed-in user so forms can prefill
 * their fields. The profile is read from the storage entry that is written
 * after a successful sign-in (`petad_user`).
 *
 * Every field is optional in storage: a user who has never provided a phone
 * number simply gets an empty string, which the applicant form still lets
 * them fill in.
 */
export interface CurrentUser {
  fullName: string;
  email: string;
  phone: string;
}

export const CURRENT_USER_STORAGE_KEY = "petad_user";

interface StoredUserProfile {
  fullName?: string;
  email?: string;
  phone?: string;
}

function readStoredProfile(): StoredUserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw =
    window.localStorage.getItem(CURRENT_USER_STORAGE_KEY) ??
    window.sessionStorage.getItem(CURRENT_USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as StoredUserProfile;
  } catch {
    return null;
  }
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function useCurrentUser(): CurrentUser {
  return useMemo(() => {
    const profile = readStoredProfile();

    return {
      fullName: toTrimmedString(profile?.fullName),
      email: toTrimmedString(profile?.email),
      phone: toTrimmedString(profile?.phone),
    };
  }, []);
}
