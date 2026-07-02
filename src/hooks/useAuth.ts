/**
 * useAuth
 *
 * Returns whether the current user is authenticated by checking for an
 * auth_token in localStorage or sessionStorage (mirrors ApiClient.getToken).
 */
export function useAuth() {
  const token =
    localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');

  return { isAuthenticated: token !== null };
}
