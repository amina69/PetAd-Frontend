import { apiClient } from "../lib/api-client";
import type {
  PasswordResetRequestPayload,
  PasswordResetPayload,
  PasswordResetRequestResponse,
  PasswordResetResponse,
} from "../types/auth";

export interface RegisterPayload {
  email: string;
  fullName: string;
  nin: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const authService = {
  async register(payload: RegisterPayload): Promise<void> {
    await apiClient.post("/auth/register", payload);
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/login", payload);
  },

  async requestPasswordReset(
    payload: PasswordResetRequestPayload,
  ): Promise<PasswordResetRequestResponse> {
    return apiClient.post<PasswordResetRequestResponse>(
      "/auth/request-password-reset",
      payload,
    );
  },

  async resetPassword(
    payload: PasswordResetPayload,
  ): Promise<PasswordResetResponse> {
    return apiClient.post<PasswordResetResponse>(
      "/auth/reset-password",
      payload,
    );
  },
};
