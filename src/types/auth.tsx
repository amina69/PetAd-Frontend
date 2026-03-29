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
// Define the specific roles allowed in the app
export type UserRole = 'ADMIN' | 'SHELTER' | 'USER';

// Define what a User who USES that role
export interface User {
  id: string;
  email: string;
  role: UserRole;
}