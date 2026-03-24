export interface ApiError extends Error {
  status?: number;
  data?: unknown;
  isNetworkError?: boolean;
}

export interface ApiClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
  onUnauthorized?: () => void;
}
