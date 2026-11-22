const SESSION_STATUS_KEY = "petad:session";

let loginRedirectStarted = false;

export function markSessionUnauthenticated(): void {
	if (typeof window === "undefined") return;
	sessionStorage.setItem(SESSION_STATUS_KEY, "unauthenticated");
}

export function clearUnauthenticatedSession(): void {
	if (typeof window === "undefined") return;
	sessionStorage.removeItem(SESSION_STATUS_KEY);
}

export function isSessionUnauthenticated(): boolean {
	if (typeof window === "undefined") return false;
	return sessionStorage.getItem(SESSION_STATUS_KEY) === "unauthenticated";
}

/** Send the user to login once, preserving the current path as `redirect`. */
export function redirectToLogin(): void {
	if (loginRedirectStarted || typeof window === "undefined") return;
	if (window.location.pathname === "/login") return;
	loginRedirectStarted = true;
	const next = `${window.location.pathname}${window.location.search}`;
	window.location.assign(`/login?redirect=${encodeURIComponent(next)}`);
}

export function resetLoginRedirectForTests(): void {
	loginRedirectStarted = false;
}
