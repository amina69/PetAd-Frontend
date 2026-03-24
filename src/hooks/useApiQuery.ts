import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ApiError } from "../types/auth";

interface UseApiQueryReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  isForbidden: boolean;
  isNotFound: boolean;
  error: ApiError | null;
}

/**
 * A thin wrapper around useQuery that handles loading, error, and empty states consistently.
 * 
 * - 401 Unauthorized: Redirects to /login
 * - 403 Forbidden: Returns isForbidden: true
 * - 404 Not Found: Returns isNotFound: true
 */
export function useApiQuery<T>(
  key: any[],
  fetchFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
): UseApiQueryReturn<T> {
  const { data, isLoading, isError, error } = useQuery<T, ApiError>({
    queryKey: key,
    queryFn: fetchFn,
    ...options,
  });

  const status = error?.status;

  // Handle 401 Unauthorized
  if (status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return {
    data,
    isLoading,
    isError,
    isForbidden: status === 403,
    isNotFound: status === 404,
    error: error || null,
  };
}
