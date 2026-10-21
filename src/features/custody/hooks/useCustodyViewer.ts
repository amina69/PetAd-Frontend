import { useMemo, useState } from "react";

/**
 * The signed-in user, as mirrored into `localStorage` by the sign-in form.
 */
export interface SessionUser {
  id: string;
  email?: string;
  fullName?: string;
  role?: string;
}

/** Key the signed-in user is mirrored to (see `SignInForm`). */
export const SESSION_USER_STORAGE_KEY = "petad_user";

/** Reads the mirrored session user, if there is one. */
export function readSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed || typeof parsed.id !== "string" || parsed.id === "") {
      return null;
    }

    return parsed;
  } catch {
    // Storage unavailable or corrupted — treat the session as anonymous.
    return null;
  }
}

/**
 * useCustodyViewer — who the current user is, from the mirrored session.
 *
 * A custody arrangement has two sides: the pet **owner** and the
 * **caretaker**. Rendering an arrangement from the right side needs the
 * signed-in user's id, which is what this hook exposes.
 *
 * NOTE: this is a deliberately small, custody-scoped stand-in. The shared
 * `useCurrentUser` hook (issue #650) will own this concern; once it lands
 * this hook should delegate to it so the rest of the app keeps working
 * unchanged.
 */
export function useCustodyViewer() {
  // Read once per mount — the session does not change while the app is open.
  const [user] = useState<SessionUser | null>(() => readSessionUser());

  return useMemo(
    () => ({
      user,
      userId: user?.id ?? null,
      displayName: user?.fullName ?? user?.email ?? null,
      isAuthenticated: Boolean(user?.id),
    }),
    [user],
  );
}
