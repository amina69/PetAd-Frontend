import { useMemo } from "react";
import { CURRENT_USER_STORAGE_KEY } from "../../../hooks/useCurrentUser";
import type { CurrentUser } from "../types/message";

/** Reads the signed-in user's identity from the entry written at login. */
export function readMessagingUser(): CurrentUser | null {
  try {
    const raw =
      localStorage.getItem(CURRENT_USER_STORAGE_KEY) ??
      sessionStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      typeof (parsed as CurrentUser).id === "string" &&
      typeof (parsed as CurrentUser).fullName === "string"
    ) {
      return parsed as CurrentUser;
    }
  } catch {
    // Storage unavailable: the UI degrades to treating every sender as "other".
  }
  return null;
}

/** The signed-in user (`null` when unknown). */
export function useMessagingUser(): CurrentUser | null {
  return useMemo(() => readMessagingUser(), []);
}
