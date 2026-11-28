export const RETURN_PATH_KEY = "petad_return_to";
export const AUTH_TOKEN_KEY = "auth_token";
export const ROLE_KEY = "petad_user_role";
export const PROFILE_CACHE_KEY = "petad_profile";

const CACHE_KEYS = [AUTH_TOKEN_KEY, ROLE_KEY, PROFILE_CACHE_KEY];

function isAppPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

export function rememberReturnPath(path: string) {
  if (!isAppPath(path)) return;
  sessionStorage.setItem(RETURN_PATH_KEY, path);
}

export function consumeReturnPath(fallback = "/home") {
  const stored = sessionStorage.getItem(RETURN_PATH_KEY);
  sessionStorage.removeItem(RETURN_PATH_KEY);
  if (!stored || !isAppPath(stored)) return fallback;
  return stored;
}

export function readRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function canAccessRole(role: string | null, allowed: string[]) {
  if (!role) return false;
  return allowed.includes(role);
}

export function establishSession(role = "user") {
  localStorage.setItem(AUTH_TOKEN_KEY, "session");
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuthCache() {
  for (const key of CACHE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
